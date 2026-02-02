
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');

// Helper to read from SQLite
const getSqliteData = (db, sql) => {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

async function migrate() {
    console.log("Starting Migration from SQLite to MySQL...");

    // 1. Connect to SQLite (pos.db)
    const sqlitePath = path.resolve(__dirname, '../pos.db');
    const sqliteDb = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY);
    console.log(`Opened SQLite DB: ${sqlitePath}`);

    // 2. Connect to MySQL Master
    const masterPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_MASTER_NAME,
        waitForConnections: true,
        connectionLimit: 5
    });

    try {
        // Test Connection
        await masterPool.query("SELECT 1");
        console.log("Connected to MySQL Master.");

        // --- MASTER DB SETUP ---

        // Ensure User Lookup Table Exists
        await masterPool.query(`CREATE TABLE IF NOT EXISTS user_lookup (
            username VARCHAR(255) PRIMARY KEY,
            tenant_id INT NOT NULL
        )`);

        // Ensure Tenant 1 Exists
        // We assume Tenant 1 is the "Legacy" tenant for migrated data
        const [tenants] = await masterPool.query("SELECT * FROM tenants WHERE id = 1");
        if (tenants.length === 0) {
            console.log("Creating Tenant 1 for Legacy Data...");
            // Need to insert into tenants table. Ensure table exists?
            // Assuming master_db.js has run, or we create it here.
            await masterPool.query(`CREATE TABLE IF NOT EXISTS tenants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                business_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                plan VARCHAR(255) DEFAULT 'free',
                subscription_expiry DATETIME,
                is_active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
            
            const hash = bcrypt.hashSync('admin123', 10);
            await masterPool.query(`INSERT INTO tenants (id, business_name, email, password, plan, is_active) 
                VALUES (1, 'Legacy Store', 'legacy@store.com', ?, 'unlimited', 1)`, [hash]);
        }

        // --- TENANT DB SETUP ---

        const tenantId = 1;
        const tenantDbName = `invoicing_tenant_${tenantId}`;
        
        console.log(`Preparing Tenant DB: ${tenantDbName}`);
        await masterPool.query(`CREATE DATABASE IF NOT EXISTS ${tenantDbName}`);

        const tenantPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: tenantDbName
        });

        // Create Tables in Tenant DB
        await tenantPool.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'cashier'
        )`);

        await tenantPool.query(`CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            stock INT DEFAULT 0,
            pctCode VARCHAR(50),
            taxRate DECIMAL(5, 2) DEFAULT 17
        )`);

        await tenantPool.query(`CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoiceNumber VARCHAR(255) UNIQUE,
            date DATETIME,
            totalAmount DECIMAL(10, 2),
            buyerName VARCHAR(255),
            buyerCNIC VARCHAR(50),
            buyerNTN VARCHAR(50),
            buyerPhone VARCHAR(50),
            fbrResponse TEXT,
            items TEXT
        )`);

        await tenantPool.query(`CREATE TABLE IF NOT EXISTS settings (
            \`key\` VARCHAR(255) PRIMARY KEY,
            value TEXT
        )`);

        // --- DATA MIGRATION ---

        // 1. Users
        console.log("Migrating Users...");
        const sqliteUsers = await getSqliteData(sqliteDb, "SELECT * FROM users");
        for (const u of sqliteUsers) {
            // Check if exists in Tenant DB
            const [exists] = await tenantPool.query("SELECT * FROM users WHERE username = ?", [u.username]);
            if (exists.length === 0) {
                await tenantPool.query("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)", 
                    [u.name || u.username, u.username, u.password, u.role]);
                console.log(`  Migrated user: ${u.username}`);
            }

            // Link in Master
            const [lookup] = await masterPool.query("SELECT * FROM user_lookup WHERE username = ?", [u.username]);
            if (lookup.length === 0) {
                await masterPool.query("INSERT INTO user_lookup (username, tenant_id) VALUES (?, ?)", [u.username, tenantId]);
                console.log(`  Linked user ${u.username} to Tenant ${tenantId}`);
            }
        }

        // 2. Products
        console.log("Migrating Products...");
        const sqliteProducts = await getSqliteData(sqliteDb, "SELECT * FROM products");
        const productMap = new Map(); // Old ID -> New ID

        for (const p of sqliteProducts) {
            // Check by name to avoid duplicates if re-running
            const [existing] = await tenantPool.query("SELECT id FROM products WHERE name = ?", [p.name]);
            if (existing.length > 0) {
                productMap.set(p.id.toString(), existing[0].id);
                continue;
            }

            const [res] = await tenantPool.query("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)", 
                [p.name, p.price, p.stock || 0]);
            
            productMap.set(p.id.toString(), res.insertId);
            // console.log(`  Migrated product: ${p.name}`);
        }
        console.log(`  Migrated ${sqliteProducts.length} products.`);

        // 3. Invoices
        console.log("Migrating Invoices...");
        const sqliteInvoices = await getSqliteData(sqliteDb, "SELECT * FROM invoices");
        const sqliteItems = await getSqliteData(sqliteDb, "SELECT * FROM invoice_items");

        // Group items by invoice_id
        const itemsByInvoice = {};
        sqliteItems.forEach(item => {
            if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
            itemsByInvoice[item.invoice_id].push(item);
        });

        let invoiceCount = 0;
        for (const inv of sqliteInvoices) {
            // Check existence
            const [existing] = await tenantPool.query("SELECT id FROM invoices WHERE invoiceNumber = ?", [inv.invoice_number]);
            if (existing.length > 0) continue;

            // Prepare items
            const oldItems = itemsByInvoice[inv.id] || [];
            const newItems = oldItems.map(item => ({
                product_id: productMap.get(item.product_id.toString()) || null, // Map to new ID
                name: item.product_name || "Unknown Product", // Fallback if name not in item
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            }));

            // Map columns
            // SQLite: invoice_number, date, total_amount, buyer_name, etc.
            // MySQL: invoiceNumber, date, totalAmount, buyerName
            await tenantPool.query(`INSERT INTO invoices 
                (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse, items) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    inv.invoice_number, 
                    inv.date, 
                    inv.total_amount, 
                    inv.buyer_name || null,
                    inv.buyer_cnic || null,
                    inv.buyer_ntn || null,
                    inv.buyer_phone || null,
                    inv.fbr_response || null, // Assuming column exists in SQLite
                    JSON.stringify(newItems)
                ]
            );
            invoiceCount++;
        }
        console.log(`  Migrated ${invoiceCount} invoices.`);

        // 4. Settings
        console.log("Migrating Settings...");
        const sqliteSettings = await getSqliteData(sqliteDb, "SELECT * FROM settings");
        for (const s of sqliteSettings) {
             const [existing] = await tenantPool.query("SELECT * FROM settings WHERE `key` = ?", [s.key]);
             if (existing.length === 0) {
                 await tenantPool.query("INSERT INTO settings (`key`, value) VALUES (?, ?)", [s.key, s.value]);
             }
        }
        console.log(`  Migrated settings.`);

        console.log("\nMigration Successfully Completed!");

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await masterPool.end();
        sqliteDb.close();
        process.exit();
    }
}

migrate();
