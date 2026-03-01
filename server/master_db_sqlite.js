
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tenants Table
        db.run(`CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            plan TEXT DEFAULT 'free',
            subscription_expiry DATETIME,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // User Lookup Table
        db.run(`CREATE TABLE IF NOT EXISTS user_lookup (
            username TEXT PRIMARY KEY,
            tenant_id INTEGER NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )`);

        // Insert Default Packages
        db.get("SELECT count(*) as count FROM packages", (err, row) => {
            if (row && row.count === 0) {
                const insertPkg = "INSERT INTO packages (name, price, duration_days, features) VALUES (?, ?, ?, ?)";
                db.run(insertPkg, ["Trial", 0, 14, JSON.stringify(["Basic POS", "50 Products"])]);
                db.run(insertPkg, ["Monthly", 29.99, 30, JSON.stringify(["Unlimited POS", "Unlimited Products", "Email Support"])]);
                db.run(insertPkg, ["Yearly", 299.99, 365, JSON.stringify(["All Features", "Priority Support"])]);
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
