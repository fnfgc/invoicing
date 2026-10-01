const mysql = require('mysql2');
const pool = require('./mysql_config');
const bcrypt = require('bcryptjs');

// Wrapper to mimic SQLite API for backward compatibility
const db = {
    run: (sql, params, callback) => {
        // Handle optional params
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        
        pool.query(sql, params, function(err, results) {
            if (callback) {
                // Mimic SQLite 'this' context for lastID and changes
                const context = {};
                if (results) {
                    context.lastID = results.insertId;
                    context.changes = results.affectedRows;
                }
                callback.call(context, err);
            }
        });
    },
    get: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params, (err, results) => {
            if (err) return callback(err);
            // Return first row or undefined
            callback(null, results && results.length > 0 ? results[0] : undefined);
        });
    },
    all: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params, (err, results) => {
            callback(err, results);
        });
    }
    // Note: 'serialize' and 'prepare' are not fully implemented as wrappers
    // because they are specific to SQLite's control flow.
    // We will handle initialization explicitly below.
};

const initDB = async () => {
    const promisePool = pool.promise();

    try {
        // Packages Table
        await promisePool.query(`CREATE TABLE IF NOT EXISTS packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            duration_days INT NOT NULL,
            features TEXT,
            ai_enabled TINYINT(1) DEFAULT 0,
            accounting_enabled TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Ensure new columns exist
        try {
            await promisePool.query("ALTER TABLE packages ADD COLUMN ai_enabled TINYINT(1) DEFAULT 0");
        } catch (e) {
            // Ignore "Duplicate column name" error (Code 1060)
            if (e.errno !== 1060) console.warn("Migration warning (ai_enabled):", e.message);
        }
        try {
            await promisePool.query("ALTER TABLE packages ADD COLUMN accounting_enabled TINYINT(1) DEFAULT 1");
        } catch (e) {
            if (e.errno !== 1060) console.warn("Migration warning (accounting_enabled):", e.message);
        }

        try {
            await promisePool.query("ALTER TABLE packages ADD COLUMN website_enabled TINYINT(1) DEFAULT 1");
        } catch (e) {
            if (e.errno !== 1060) console.warn("Migration warning (website_enabled):", e.message);
        }

        try {
            await promisePool.query("ALTER TABLE packages ADD COLUMN max_users INT DEFAULT 1");
        } catch (e) {
            if (e.errno !== 1060) console.warn("Migration warning (max_users):", e.message);
        }

        try {
            await promisePool.query("ALTER TABLE packages ADD COLUMN extra_user_price DECIMAL(10, 2) DEFAULT 5.00");
        } catch (e) {
            if (e.errno !== 1060) console.warn("Migration warning (extra_user_price):", e.message);
        }

        // Tenants Table
        await promisePool.query(`CREATE TABLE IF NOT EXISTS tenants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            business_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            plan VARCHAR(255) DEFAULT 'free',
            subscription_expiry DATETIME,
            is_active TINYINT(1) DEFAULT 1,
            custom_domain VARCHAR(255),
            slug VARCHAR(255),
            website_enabled TINYINT(1) DEFAULT 1,
            business_type VARCHAR(50) DEFAULT 'general',
            business_ntn VARCHAR(50),
            business_province VARCHAR(100) DEFAULT 'Punjab',
            fbr_enabled TINYINT(1) DEFAULT 1,
            fbr_environment VARCHAR(20) DEFAULT 'sandbox',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Robust check and add for every required column in tenants
        const ensureTenantCol = async (colName, colType) => {
            try {
                const [cols] = await promisePool.query(`SHOW COLUMNS FROM tenants LIKE ?`, [colName]);
                if (!cols || cols.length === 0) {
                    await promisePool.query(`ALTER TABLE tenants ADD COLUMN ${colName} ${colType}`);
                    console.log(`✅ Migration: Added column '${colName}' to tenants table.`);
                }
            } catch (err) {
                console.warn(`Migration check for '${colName}':`, err.message);
            }
        };

        await ensureTenantCol('website_enabled', 'TINYINT(1) DEFAULT 1');
        await ensureTenantCol('custom_domain', 'VARCHAR(255)');
        await ensureTenantCol('slug', 'VARCHAR(255)');
        await ensureTenantCol('business_type', "VARCHAR(50) DEFAULT 'general'");
        await ensureTenantCol('business_ntn', 'VARCHAR(50)');
        await ensureTenantCol('business_province', "VARCHAR(100) DEFAULT 'Punjab'");
        await ensureTenantCol('fbr_enabled', 'TINYINT(1) DEFAULT 1');
        await ensureTenantCol('fbr_environment', "VARCHAR(20) DEFAULT 'sandbox'");
        await ensureTenantCol('is_active', 'TINYINT(1) DEFAULT 1');

        // Backfill logic for slug if any tenant lacks a slug
        try {
            const [rows] = await promisePool.query("SELECT id, business_name FROM tenants WHERE slug IS NULL OR slug = ''");
            for (const row of rows) {
                let s = (row.business_name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                if (!s) s = 'store';
                s = `${s}-${row.id}`;
                await promisePool.query("UPDATE tenants SET slug = ? WHERE id = ?", [s, row.id]);
                console.log(`Backfilled slug for tenant ${row.id}: ${s}`);
            }
        } catch (e) {
            console.warn("Slug backfill warning:", e.message);
        }

        // User Lookup Table
        await promisePool.query(`CREATE TABLE IF NOT EXISTS user_lookup (
            username VARCHAR(255) PRIMARY KEY,
            tenant_id INT NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )`);

        await promisePool.query(`CREATE TABLE IF NOT EXISTS system_settings (
            \`key\` VARCHAR(255) PRIMARY KEY,
            \`value\` TEXT
        )`);

        // Ensure Single Standard Package ($19.99, 1 User Included, $5.00 per extra user)
        const singleFeatures = JSON.stringify([
            "Full POS Access: 1 User Included",
            "Direct FBR Fiscal Integration & Live QR Receipts",
            "Pharmacy, Grocery, Shoes, Clothes, Takeaways & Retail Ready",
            "Unlimited Transactions & Invoicing",
            "Inventory, Barcode Scanning, Batch & Expiry Tracking",
            "Financial Accounting, Ledgers & Tax Reports",
            "E-Commerce Online Web Storefront",
            "Additional Users: $5.00 / month each"
        ]);

        const [existingPkgs] = await promisePool.query("SELECT * FROM packages");
        if (existingPkgs.length === 0) {
            const insertPkg = "INSERT INTO packages (name, price, duration_days, features, ai_enabled, accounting_enabled, website_enabled, max_users, extra_user_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            await promisePool.query(insertPkg, ["All-in-One POS", 19.99, 30, singleFeatures, 1, 1, 1, 1, 5.00]);
            console.log("✅ Default Single Package Created (MySQL): All-in-One POS ($19.99/mo, 1 user included, $5/extra user)");
        } else {
            // Keep single package by updating primary package and removing legacy/test packages
            const primaryId = existingPkgs[0].id;
            await promisePool.query(
                "UPDATE packages SET name = ?, price = ?, duration_days = ?, features = ?, ai_enabled = 1, accounting_enabled = 1, website_enabled = 1, max_users = 1, extra_user_price = 5.00 WHERE id = ?",
                ["All-in-One POS", 19.99, 30, singleFeatures, primaryId]
            );
            if (existingPkgs.length > 1) {
                await promisePool.query("DELETE FROM packages WHERE id != ?", [primaryId]);
                console.log(`✅ Consolidated ${existingPkgs.length} packages into 1 unified package (ID: ${primaryId}).`);
            }
            await promisePool.query("UPDATE tenants SET plan = 'All-in-One POS' WHERE email != 'superadmin@fnf.com'");
        }

        // Super Admin
        const [adminRows] = await promisePool.query("SELECT * FROM tenants WHERE email = 'superadmin@fnf.com'");
        if (adminRows.length === 0) {
            const hash = bcrypt.hashSync('admin123', 10);
            await promisePool.query(`INSERT INTO tenants (business_name, email, password, plan, is_active) 
                    VALUES ('Super Admin', 'superadmin@fnf.com', ?, 'unlimited', 1)`, [hash]);
            console.log("Super Admin Created: superadmin@fnf.com / admin123");
        }

        const defaultPaymentInstructions = {
            bankName: "HBL",
            accountTitle: "FAIZAN RASHEED",
            accountNumber: "22207902038103",
            iban: "PK08HABB0022207902038103",
            branch: "FAISALABAD-AKBAR CHO",
            email: "info@fnfgc.com"
        };
        const [payRows] = await promisePool.query("SELECT `value` FROM system_settings WHERE `key` = ?", ["payment_instructions"]);
        if (!payRows || payRows.length === 0) {
            await promisePool.query(
                "INSERT INTO system_settings (`key`, `value`) VALUES (?, ?)",
                ["payment_instructions", JSON.stringify(defaultPaymentInstructions)]
            );
        }

    } catch (err) {
        console.error("Master DB Initialization Error:", err);
    }
};

// Run initialization
// initDB(); // Moved to export to allow control

module.exports = { ...db, initDB };
