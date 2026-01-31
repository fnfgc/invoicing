const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbCache = {}; // Cache connections

const getTenantDB = (tenantId) => {
    if (!tenantId) throw new Error("Tenant ID required");

    // Super Admin doesn't have a tenant DB, or uses a specific one?
    // Let's assume Super Admin manages Master DB, but if they need to test, they create a tenant.

    if (dbCache[tenantId]) {
        return dbCache[tenantId];
    }

    const dbName = `tenant_${tenantId}.db`;
    const dbPath = path.resolve(__dirname, 'data', dbName);
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = new sqlite3.Database(dbPath);

    // Initialize Tenant Schema if new
    db.serialize(() => {
        // Products
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            pctCode TEXT,
            taxRate REAL DEFAULT 17
        )`);

        // Invoices
        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoiceNumber TEXT UNIQUE,
            date TEXT,
            totalAmount REAL,
            buyerName TEXT,
            buyerCNIC TEXT,
            buyerNTN TEXT,
            buyerPhone TEXT,
            fbrResponse TEXT
        )`);

        // Users (Cashiers/Admins within the business)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'cashier'
        )`);

        // Settings
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);
        
        // Seed default admin for the tenant
        db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
            if (!row) {
                 // Default tenant admin: admin / admin123
                 // In real app, we might want to sync this with the Master DB password
                 // But keeping them separate allows the business owner to have a 'POS Admin' account
                 // separate from their 'Billing Account'.
                 // For simplicity, we'll insert a default POS user.
                 db.run(`INSERT INTO users (name, username, password, role) VALUES ('Admin', 'admin', 'admin123', 'admin')`);
            }
        });
    });

    dbCache[tenantId] = db;
    return db;
};

module.exports = { getTenantDB };
