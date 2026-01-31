const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'master.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Packages Table
    db.run(`CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        duration_days INTEGER NOT NULL,
        features TEXT, -- JSON string of features
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tenants Table (Businesses)
    db.run(`CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        plan TEXT DEFAULT 'free', -- Store Package Name or ID
        subscription_expiry DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User Lookup Table (For Sub-users to find their Tenant)
    db.run(`CREATE TABLE IF NOT EXISTS user_lookup (
        username TEXT PRIMARY KEY,
        tenant_id INTEGER NOT NULL,
        FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    )`);

    // Insert Default Packages if empty
    db.get("SELECT count(*) as count FROM packages", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO packages (name, price, duration_days, features) VALUES (?, ?, ?, ?)");
            stmt.run("Trial", 0, 14, JSON.stringify(["Basic POS", "50 Products"]));
            stmt.run("Monthly", 29.99, 30, JSON.stringify(["Unlimited POS", "Unlimited Products", "Email Support"]));
            stmt.run("Yearly", 299.99, 365, JSON.stringify(["All Features", "Priority Support"]));
            stmt.finalize();
            console.log("Default Packages Created");
        }
    });

    // Super Admin (Hardcoded for initial setup if not exists)
    db.get("SELECT * FROM tenants WHERE email = 'superadmin@fnf.com'", (err, row) => {
        if (!row) {
            const hash = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO tenants (business_name, email, password, plan, is_active) 
                    VALUES ('Super Admin', 'superadmin@fnf.com', ?, 'unlimited', 1)`, [hash]);
            console.log("Super Admin Created: superadmin@fnf.com / admin123");
        }
    });
});

module.exports = db;
