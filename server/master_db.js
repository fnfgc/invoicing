const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'master.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Tenants Table (Businesses)
    db.run(`CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        plan TEXT DEFAULT 'free', -- 'free', 'monthly', 'yearly'
        subscription_expiry DATETIME,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

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
