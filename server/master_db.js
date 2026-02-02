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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tenants Table
        await promisePool.query(`CREATE TABLE IF NOT EXISTS tenants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            business_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            plan VARCHAR(255) DEFAULT 'free',
            subscription_expiry DATETIME,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // User Lookup Table
        await promisePool.query(`CREATE TABLE IF NOT EXISTS user_lookup (
            username VARCHAR(255) PRIMARY KEY,
            tenant_id INT NOT NULL,
            FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )`);

        // Insert Default Packages
        const [pkgRows] = await promisePool.query("SELECT count(*) as count FROM packages");
        if (pkgRows[0].count === 0) {
            const insertPkg = "INSERT INTO packages (name, price, duration_days, features) VALUES (?, ?, ?, ?)";
            await promisePool.query(insertPkg, ["Trial", 0, 14, JSON.stringify(["Basic POS", "50 Products"])]);
            await promisePool.query(insertPkg, ["Monthly", 29.99, 30, JSON.stringify(["Unlimited POS", "Unlimited Products", "Email Support"])]);
            await promisePool.query(insertPkg, ["Yearly", 299.99, 365, JSON.stringify(["All Features", "Priority Support"])]);
            console.log("Default Packages Created");
        }

        // Super Admin
        const [adminRows] = await promisePool.query("SELECT * FROM tenants WHERE email = 'superadmin@fnf.com'");
        if (adminRows.length === 0) {
            const hash = bcrypt.hashSync('admin123', 10);
            await promisePool.query(`INSERT INTO tenants (business_name, email, password, plan, is_active) 
                    VALUES ('Super Admin', 'superadmin@fnf.com', ?, 'unlimited', 1)`, [hash]);
            console.log("Super Admin Created: superadmin@fnf.com / admin123");
        }

    } catch (err) {
        console.error("Master DB Initialization Error:", err);
    }
};

// Run initialization
initDB();

module.exports = db;
