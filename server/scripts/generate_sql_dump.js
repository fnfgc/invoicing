
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const OUTPUT_FILE = path.join(__dirname, '../full_migration.sql');
const SQLITE_DB_PATH = path.join(__dirname, '../pos.db');

// Helper to escape SQL strings
const escape = (str) => {
    if (str === null || str === undefined) return 'NULL';
    if (typeof str === 'number') return str;
    return `'${String(str).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
};

const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

const getSqliteData = (sql) => {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

async function generateDump() {
    console.log("Generating SQL Dump...");
    let sql = "";

    // Header
    sql += "-- Full MySQL Migration Dump (Single DB Strategy)\n";
    sql += "-- Generated on " + new Date().toISOString() + "\n\n";
    sql += "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    // --- MASTER DATABASE TABLES ---
    sql += "-- --------------------------------------------------------\n";
    sql += "-- Master Database Structure\n";
    sql += "-- --------------------------------------------------------\n\n";

    // Drop existing tables to ensure clean slate
    sql += "DROP TABLE IF EXISTS `user_lookup`;\n";
    sql += "DROP TABLE IF EXISTS `tenants`;\n";
    sql += "DROP TABLE IF EXISTS `packages`;\n";
    sql += "DROP TABLE IF EXISTS `tenant_1_users`;\n";
    sql += "DROP TABLE IF EXISTS `tenant_1_products`;\n";
    sql += "DROP TABLE IF EXISTS `tenant_1_invoices`;\n";
    sql += "DROP TABLE IF EXISTS `tenant_1_settings`;\n\n";

    // Packages
    sql += "CREATE TABLE IF NOT EXISTS `packages` (\n";
    sql += "  `id` int(11) NOT NULL AUTO_INCREMENT,\n";
    sql += "  `name` varchar(255) NOT NULL,\n";
    sql += "  `price` decimal(10,2) NOT NULL,\n";
    sql += "  `duration_days` int(11) NOT NULL,\n";
    sql += "  `features` text,\n";
    sql += "  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,\n";
    sql += "  PRIMARY KEY (`id`)\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // Tenants
    sql += "CREATE TABLE IF NOT EXISTS `tenants` (\n";
    sql += "  `id` int(11) NOT NULL AUTO_INCREMENT,\n";
    sql += "  `business_name` varchar(255) NOT NULL,\n";
    sql += "  `email` varchar(255) NOT NULL,\n";
    sql += "  `password` varchar(255) NOT NULL,\n";
    sql += "  `plan` varchar(255) DEFAULT 'free',\n";
    sql += "  `subscription_expiry` datetime DEFAULT NULL,\n";
    sql += "  `is_active` tinyint(1) DEFAULT '1',\n";
    sql += "  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,\n";
    sql += "  PRIMARY KEY (`id`),\n";
    sql += "  UNIQUE KEY `email` (`email`)\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // User Lookup
    sql += "CREATE TABLE IF NOT EXISTS `user_lookup` (\n";
    sql += "  `username` varchar(255) NOT NULL,\n";
    sql += "  `tenant_id` int(11) NOT NULL,\n";
    sql += "  PRIMARY KEY (`username`),\n";
    sql += "  KEY `tenant_id` (`tenant_id`),\n";
    sql += "  CONSTRAINT `user_lookup_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // --- MASTER DATA INJECTION ---
    sql += "-- --------------------------------------------------------\n";
    sql += "-- Master Data Injection\n";
    sql += "-- --------------------------------------------------------\n\n";

    // Default Packages
    sql += "INSERT INTO `packages` (`id`, `name`, `price`, `duration_days`, `features`) VALUES\n";
    sql += "(1, 'Trial', 0.00, 14, " + escape(JSON.stringify(["Basic POS", "50 Products"])) + "),\n";
    sql += "(2, 'Monthly', 29.99, 30, " + escape(JSON.stringify(["Unlimited POS", "Unlimited Products", "Email Support"])) + "),\n";
    sql += "(3, 'Yearly', 299.99, 365, " + escape(JSON.stringify(["All Features", "Priority Support"])) + ");\n\n";

    // Super Admin & Legacy Tenant
    const adminHash = bcrypt.hashSync('admin123', 10);
    sql += `INSERT INTO \`tenants\` (\`id\`, \`business_name\`, \`email\`, \`password\`, \`plan\`, \`is_active\`) VALUES\n`;
    sql += `(999, 'Super Admin', 'superadmin@fnf.com', ${escape(adminHash)}, 'unlimited', 1),\n`;
    sql += `(1, 'Legacy Store', 'legacy@store.com', ${escape(adminHash)}, 'unlimited', 1);\n\n`;

    // --- TENANT 1 TABLES (PREFIXED) ---
    // Instead of creating a new DB, we prefix tables with `tenant_1_`
    
    sql += "-- --------------------------------------------------------\n";
    sql += "-- Tenant 1 (Legacy) Table Structure (Prefix Strategy)\n";
    sql += "-- --------------------------------------------------------\n\n";
    
    // Users
    sql += "CREATE TABLE IF NOT EXISTS `tenant_1_users` (\n";
    sql += "  `id` int(11) NOT NULL AUTO_INCREMENT,\n";
    sql += "  `name` varchar(255) NOT NULL,\n";
    sql += "  `username` varchar(255) NOT NULL,\n";
    sql += "  `password` varchar(255) NOT NULL,\n";
    sql += "  `role` varchar(50) DEFAULT 'cashier',\n";
    sql += "  PRIMARY KEY (`id`),\n";
    sql += "  UNIQUE KEY `username` (`username`)\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // Products
    sql += "CREATE TABLE IF NOT EXISTS `tenant_1_products` (\n";
    sql += "  `id` int(11) NOT NULL AUTO_INCREMENT,\n";
    sql += "  `name` varchar(255) NOT NULL,\n";
    sql += "  `price` decimal(10,2) NOT NULL,\n";
    sql += "  `stock` int(11) DEFAULT '0',\n";
    sql += "  `pctCode` varchar(50) DEFAULT NULL,\n";
    sql += "  `taxRate` decimal(5,2) DEFAULT '17.00',\n";
    sql += "  PRIMARY KEY (`id`)\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // Invoices
    sql += "CREATE TABLE IF NOT EXISTS `tenant_1_invoices` (\n";
    sql += "  `id` int(11) NOT NULL AUTO_INCREMENT,\n";
    sql += "  `invoiceNumber` varchar(255) DEFAULT NULL,\n";
    sql += "  `date` datetime DEFAULT NULL,\n";
    sql += "  `totalAmount` decimal(10,2) DEFAULT NULL,\n";
    sql += "  `buyerName` varchar(255) DEFAULT NULL,\n";
    sql += "  `buyerCNIC` varchar(50) DEFAULT NULL,\n";
    sql += "  `buyerNTN` varchar(50) DEFAULT NULL,\n";
    sql += "  `buyerPhone` varchar(50) DEFAULT NULL,\n";
    sql += "  `fbrResponse` text,\n";
    sql += "  `items` text,\n";
    sql += "  PRIMARY KEY (`id`),\n";
    sql += "  UNIQUE KEY `invoiceNumber` (`invoiceNumber`)\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // Settings
    sql += "CREATE TABLE IF NOT EXISTS `tenant_1_settings` (\n";
    sql += "  `key` varchar(255) NOT NULL,\n";
    sql += "  `value` text,\n";
    sql += "  PRIMARY KEY (`key`)\n";
    sql += ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";

    // --- DATA MIGRATION FROM SQLITE ---
    console.log("Reading SQLite Data...");

    // 1. Users
    const users = await getSqliteData("SELECT * FROM users");
    if (users.length > 0) {
        sql += "INSERT INTO `tenant_1_users` (`name`, `username`, `password`, `role`) VALUES\n";
        const userValues = users.map(u => `(${escape(u.name || u.username)}, ${escape(u.username)}, ${escape(u.password)}, ${escape(u.role)})`);
        sql += userValues.join(",\n") + ";\n\n";

        sql += "INSERT INTO `user_lookup` (`username`, `tenant_id`) VALUES\n";
        const lookupValues = users.map(u => `(${escape(u.username)}, 1)`);
        sql += lookupValues.join(",\n") + ";\n\n";
    }

    // 2. Products
    const products = await getSqliteData("SELECT * FROM products");
    const productMap = new Map(); // Old ID -> New ID Index (1-based)
    if (products.length > 0) {
        sql += "INSERT INTO `tenant_1_products` (`name`, `price`, `stock`, `pctCode`, `taxRate`) VALUES\n";
        const prodValues = products.map((p, index) => {
            productMap.set(p.id.toString(), index + 1); // Auto increment simulation
            return `(${escape(p.name)}, ${p.price}, ${p.stock || 0}, ${escape(p.pct_code || null)}, ${p.tax_rate || 17})`;
        });
        sql += prodValues.join(",\n") + ";\n\n";
    }

    // 3. Invoices
    const invoices = await getSqliteData("SELECT * FROM invoices");
    const invoiceItems = await getSqliteData("SELECT * FROM invoice_items");
    
    const itemsByInvoice = {};
    invoiceItems.forEach(item => {
        if (!itemsByInvoice[item.invoice_id]) itemsByInvoice[item.invoice_id] = [];
        itemsByInvoice[item.invoice_id].push(item);
    });

    if (invoices.length > 0) {
        sql += "INSERT INTO `tenant_1_invoices` (`invoiceNumber`, `date`, `totalAmount`, `buyerName`, `buyerCNIC`, `buyerNTN`, `buyerPhone`, `fbrResponse`, `items`) VALUES\n";
        const invValues = invoices.map(inv => {
            const oldItems = itemsByInvoice[inv.id] || [];
            const newItems = oldItems.map(item => ({
                product_id: item.product_id ? (productMap.get(item.product_id.toString()) || null) : null,
                name: item.product_name || "Unknown",
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            }));

            return `(${escape(inv.invoice_number)}, ${escape(inv.date)}, ${inv.total_amount}, ${escape(inv.buyer_name)}, ${escape(inv.buyer_cnic)}, ${escape(inv.buyer_ntn)}, ${escape(inv.buyer_phone)}, ${escape(inv.fbr_response)}, ${escape(JSON.stringify(newItems))})`;
        });
        sql += invValues.join(",\n") + ";\n\n";
    }

    // 4. Settings
    const settings = await getSqliteData("SELECT * FROM settings");
    if (settings.length > 0) {
        sql += "INSERT INTO `tenant_1_settings` (`key`, `value`) VALUES\n";
        const setValues = settings.map(s => `(${escape(s.key)}, ${escape(s.value)})`);
        sql += setValues.join(",\n") + ";\n\n";
    }

    sql += "SET FOREIGN_KEY_CHECKS = 1;\n";

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`SQL Dump generated at: ${OUTPUT_FILE}`);
    db.close();
}

generateDump().catch(console.error);
