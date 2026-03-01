
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbCache = {};

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const getTenantDB = (tenantId) => {
    if (!tenantId) throw new Error("Tenant ID required");

    if (dbCache[tenantId]) {
        return dbCache[tenantId];
    }

    const dbPath = path.join(dataDir, `tenant_${tenantId}.db`);
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error(`Error opening tenant DB ${tenantId}:`, err.message);
        }
    });

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            pctCode TEXT,
            taxRate REAL DEFAULT 17
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoiceNumber TEXT UNIQUE,
            customerName TEXT,
            totalAmount REAL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            fbrInvoiceId TEXT,
            items TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'cashier',
            name TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            reference_id TEXT,
            party_name TEXT,
            fbrResponse TEXT
        )`);

        // Add indexes or triggers if needed
    });

    dbCache[tenantId] = db;
    return db;
};

module.exports = { getTenantDB };
