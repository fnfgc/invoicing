
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
            buyerName TEXT,
            buyerCNIC TEXT,
            buyerNTN TEXT,
            buyerPhone TEXT,
            fbrResponse TEXT,
            items TEXT,
            pointsRedeemed INTEGER DEFAULT 0,
            pointsAmount REAL DEFAULT 0
        )`);

        // Migration: Add columns if they don't exist (SQLite doesn't support IF NOT EXISTS in ADD COLUMN)
        // We just run it and ignore the error if it fails (likely due to duplicate column)
        db.run(`ALTER TABLE invoices ADD COLUMN buyerName TEXT`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN buyerCNIC TEXT`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN buyerNTN TEXT`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN buyerPhone TEXT`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN fbrResponse TEXT`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN pointsRedeemed INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN pointsAmount REAL DEFAULT 0`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'completed'`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN deleted INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN returnedAt DATETIME`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN returnReason TEXT`, () => {});
        db.run(`ALTER TABLE invoices ADD COLUMN updatedAt DATETIME`, () => {});

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

        db.run(`CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phoneNumber TEXT,
            cardNumber TEXT UNIQUE,
            loyaltyPoints REAL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Add indexes or triggers if needed
    });

    dbCache[tenantId] = db;
    return db;
};

module.exports = { getTenantDB };
