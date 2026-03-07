
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'master.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('SQLite Connection Error:', err.message);
    } else {
        console.log('Connected to SQLite Master DB');
        initDB();
    }
});

const initDB = () => {
    db.serialize(() => {
        // Packages Table
        db.run(`CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            duration_days INTEGER NOT NULL,
            features TEXT,
            ai_enabled INTEGER DEFAULT 0,
            accounting_enabled INTEGER DEFAULT 1,
            website_enabled INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add website_enabled if missing
        db.run("ALTER TABLE packages ADD COLUMN website_enabled INTEGER DEFAULT 1", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (website_enabled):", err.message);
            }
        });

        // Tenants Table
        db.run(`CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            plan TEXT DEFAULT 'free',
            subscription_expiry DATETIME,
            is_active INTEGER DEFAULT 1,
            custom_domain TEXT UNIQUE,
            slug TEXT UNIQUE,
            website_enabled INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add custom_domain if missing
        db.run("ALTER TABLE tenants ADD COLUMN custom_domain TEXT UNIQUE", (err) => {
            // Ignore duplicate column error
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (custom_domain):", err.message);
            }
        });

        // Migration: Add website_enabled if missing
        db.run("ALTER TABLE tenants ADD COLUMN website_enabled INTEGER DEFAULT 1", (err) => {
            // Ignore duplicate column error
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (website_enabled):", err.message);
            }
        });

        // Migration: Add slug if missing
        db.run("ALTER TABLE tenants ADD COLUMN slug TEXT UNIQUE", (err) => {
             if (err && !err.message.includes("duplicate column name")) {
                 // console.warn("Migration warning (slug):", err.message);
             } else {
                 // Backfill slugs if added
                 db.all("SELECT id, business_name FROM tenants WHERE slug IS NULL", (err, rows) => {
                     if (rows) {
                         rows.forEach(row => {
                             // Generate simple slug
                             let slug = row.business_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                             if (!slug) slug = 'store';
                             slug = slug + '-' + row.id; // Ensure uniqueness by appending ID
                             db.run("UPDATE tenants SET slug = ? WHERE id = ?", [slug, row.id]);
                             console.log(`Backfilled slug for tenant ${row.id}: ${slug}`);
                         });
                     }
                 });
             }
        });

        // User Lookup Table
        db.run(`CREATE TABLE IF NOT EXISTS user_lookup (
            username TEXT PRIMARY KEY,
            tenant_id INTEGER NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )`);

        // Insert Default Packages
        db.get("SELECT count(*) as count FROM packages", (err, row) => {
            if (row && row.count === 0) {
                const insertPkg = "INSERT INTO packages (name, price, duration_days, features, ai_enabled, accounting_enabled) VALUES (?, ?, ?, ?, ?, ?)";
                db.run(insertPkg, ["Trial", 0, 14, JSON.stringify(["Basic POS", "50 Products"]), 0, 1]);
                db.run(insertPkg, ["Monthly (Standard)", 19.99, 30, JSON.stringify(["Unlimited POS", "Unlimited Products", "Email Support"]), 0, 1]);
                db.run(insertPkg, ["Monthly (AI Pro)", 39.99, 30, JSON.stringify(["Unlimited POS", "Unlimited Products", "AI Insights", "Voice Commands", "Priority Support"]), 1, 1]);
                db.run(insertPkg, ["Yearly (Standard)", 199.99, 365, JSON.stringify(["All Features (No AI)", "Priority Support"]), 0, 1]);
                db.run(insertPkg, ["Yearly (AI Pro)", 399.99, 365, JSON.stringify(["All Features + AI", "Priority Support"]), 1, 1]);
                console.log("Default Packages Created (SQLite)");
            }
        });

        // Super Admin
        db.get("SELECT * FROM tenants WHERE email = 'superadmin@fnf.com'", (err, row) => {
            if (!row) {
                const hash = bcrypt.hashSync('admin123', 10);
                db.run(`INSERT INTO tenants (business_name, email, password, plan, is_active) 
                        VALUES ('Super Admin', 'superadmin@fnf.com', ?, 'unlimited', 1)`, [hash]);
                console.log("Super Admin Created (SQLite): superadmin@fnf.com / admin123");
            }
        });
    });
};

module.exports = db;
