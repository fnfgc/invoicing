
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
            max_users INTEGER DEFAULT 1,
            extra_user_price REAL DEFAULT 5.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Migration: Add website_enabled if missing
        db.run("ALTER TABLE packages ADD COLUMN website_enabled INTEGER DEFAULT 1", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (website_enabled):", err.message);
            }
        });

        // Migration: Add ai_enabled if missing
        db.run("ALTER TABLE packages ADD COLUMN ai_enabled INTEGER DEFAULT 0", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (ai_enabled):", err.message);
            }
        });

        // Migration: Add accounting_enabled if missing
        db.run("ALTER TABLE packages ADD COLUMN accounting_enabled INTEGER DEFAULT 1", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (accounting_enabled):", err.message);
            }
        });

        // Migration: Add max_users if missing
        db.run("ALTER TABLE packages ADD COLUMN max_users INTEGER DEFAULT 1", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (max_users):", err.message);
            }
        });

        // Migration: Add extra_user_price if missing
        db.run("ALTER TABLE packages ADD COLUMN extra_user_price REAL DEFAULT 5.00", (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                // console.warn("Migration warning (extra_user_price):", err.message);
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

        // Migration: Add business_type and FBR settings to tenants
        db.run("ALTER TABLE tenants ADD COLUMN business_type TEXT DEFAULT 'general'", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN business_ntn TEXT", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN business_province TEXT DEFAULT 'Punjab'", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN fbr_enabled INTEGER DEFAULT 1", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN fbr_environment TEXT DEFAULT 'sandbox'", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN payment_receipt TEXT", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN payment_status TEXT DEFAULT 'unpaid'", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN payment_notes TEXT", () => {});
        db.run("ALTER TABLE tenants ADD COLUMN receipt_uploaded_at DATETIME", () => {});

        // User Lookup Table
        db.run(`CREATE TABLE IF NOT EXISTS user_lookup (
            username TEXT PRIMARY KEY,
            tenant_id INTEGER NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // Backfill package defaults
        db.run("UPDATE packages SET max_users = 1 WHERE max_users IS NULL OR max_users = 0");
        db.run("UPDATE packages SET extra_user_price = 5.00 WHERE extra_user_price IS NULL");

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

        db.all("SELECT * FROM packages", (err, existingPkgs) => {
            if (!existingPkgs || existingPkgs.length === 0) {
                const insertPkg = "INSERT INTO packages (name, price, duration_days, features, ai_enabled, accounting_enabled, website_enabled, max_users, extra_user_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                db.run(insertPkg, ["All-in-One POS", 19.99, 30, singleFeatures, 1, 1, 1, 1, 5.00]);
                console.log("✅ Default Single Package Created (SQLite): All-in-One POS ($19.99/mo, 1 user included, $5/extra user)");
            } else {
                const primaryId = existingPkgs[0].id;
                db.run(
                    "UPDATE packages SET name = ?, price = ?, duration_days = ?, features = ?, ai_enabled = 1, accounting_enabled = 1, website_enabled = 1, max_users = 1, extra_user_price = 5.00 WHERE id = ?",
                    ["All-in-One POS", 19.99, 30, singleFeatures, primaryId]
                );
                if (existingPkgs.length > 1) {
                    db.run("DELETE FROM packages WHERE id != ?", [primaryId]);
                }
                db.run("UPDATE tenants SET plan = 'All-in-One POS' WHERE email != 'superadmin@fnf.com'");
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

        const defaultPaymentInstructions = {
            bankName: "HBL",
            accountTitle: "FAIZAN RASHEED",
            accountNumber: "22207902038103",
            iban: "PK08HABB0022207902038103",
            branch: "FAISALABAD-AKBAR CHO",
            email: "info@fnfgc.com"
        };
        db.get("SELECT value FROM system_settings WHERE key = ?", ["payment_instructions"], (err, row) => {
            if (!row) {
                db.run(
                    "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)",
                    ["payment_instructions", JSON.stringify(defaultPaymentInstructions)]
                );
            }
        });
    });
};

module.exports = db;
