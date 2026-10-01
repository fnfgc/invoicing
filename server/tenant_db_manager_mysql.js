
const mysql = require('mysql2');
const masterPool = require('./mysql_config');
require('dotenv').config();

const dbCache = {};

// Helper to modify SQL queries to use prefixed tables
const prefixTable = (sql, tenantId) => {
    const prefix = `tenant_${tenantId}_`;
    
    let newSql = sql;
    // SQLite to MySQL syntax translations
    newSql = newSql.replace(/INSERT\s+OR\s+REPLACE\s+INTO/gi, 'REPLACE INTO');
    newSql = newSql.replace(/datetime\('now'\)/gi, 'NOW()');
    
    const tables = ['products', 'invoices', 'users', 'settings', 'transactions', 'partners', 'customers'];
    tables.forEach(table => {
        const regex = new RegExp(`\\b${table}\\b`, 'gi');
        newSql = newSql.replace(regex, `${prefix}${table}`);
    });
    
    return newSql;
};

const getTenantDB = (tenantId) => {
    if (!tenantId) throw new Error("Tenant ID required");

    if (dbCache[tenantId]) {
        return dbCache[tenantId];
    }

    const tenantPool = masterPool;

    // Async Initialization of Tables Promise
    let initResolve;
    const initPromise = new Promise(resolve => { initResolve = resolve; });

    // Wrapper to mimic SQLite API
    const db = {
        pool: tenantPool,
        run: (sql, params, callback) => {
             if (typeof params === 'function') { callback = params; params = []; }
             const prefixedSql = prefixTable(sql, tenantId);
             
             initPromise.then(() => {
                 tenantPool.query(prefixedSql, params, function(err, results) {
                     if (callback) {
                         const context = {};
                         if (results) {
                             context.lastID = results.insertId;
                             context.changes = results.affectedRows;
                         }
                         callback.call(context, err);
                     }
                 });
             }).catch(err => {
                 if (callback) callback(err);
             });
        },
        get: (sql, params, callback) => {
             if (typeof params === 'function') { callback = params; params = []; }
             const prefixedSql = prefixTable(sql, tenantId);
             
             initPromise.then(() => {
                 tenantPool.query(prefixedSql, params, (err, results) => {
                     if (err) return callback(err);
                     callback(null, results && results.length > 0 ? results[0] : undefined);
                 });
             }).catch(err => {
                 if (callback) callback(err);
             });
        },
        all: (sql, params, callback) => {
             if (typeof params === 'function') { callback = params; params = []; }
             const prefixedSql = prefixTable(sql, tenantId);
             
             initPromise.then(() => {
                 tenantPool.query(prefixedSql, params, (err, results) => {
                     callback(err, results);
                 });
             }).catch(err => {
                 if (callback) callback(err);
             });
        },
        // No-op serialize
        serialize: (cb) => {
             if(cb) cb();
        },
        prepare: (sql) => {
            console.error("prepare() called - not supported in MySQL wrapper. Please refactor.");
            throw new Error("prepare() not supported");
        }
    };

    // Async Initialization of Tables
    (async () => {
        try {
            const promisePool = tenantPool.promise();
            const prefix = `tenant_${tenantId}_`;
            
            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                stock INT DEFAULT 0,
                pctCode VARCHAR(50),
                taxRate DECIMAL(5, 2) DEFAULT 17,
                category VARCHAR(100),
                barcode VARCHAR(100),
                unit VARCHAR(50) DEFAULT 'pcs',
                hsCode VARCHAR(50),
                saleType VARCHAR(100),
                batchNumber VARCHAR(100),
                expiryDate VARCHAR(50),
                size VARCHAR(50),
                color VARCHAR(50),
                brand VARCHAR(100),
                genericName VARCHAR(255),
                minStockAlert INT DEFAULT 5
            )`);

            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}invoices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                invoiceNumber VARCHAR(255) UNIQUE,
                date DATETIME,
                totalAmount DECIMAL(10, 2),
                buyerName VARCHAR(255),
                buyerCNIC VARCHAR(50),
                buyerNTN VARCHAR(50),
                buyerPhone VARCHAR(50),
                fbrResponse TEXT,
                items TEXT,
                pointsRedeemed INT DEFAULT 0,
                pointsAmount DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'completed',
                deleted TINYINT DEFAULT 0,
                returnedAt DATETIME,
                returnReason TEXT,
                updatedAt DATETIME,
                fbrInvoiceNumber VARCHAR(255),
                fbrStatusCode VARCHAR(20),
                fbrStatus VARCHAR(50),
                fbrQrData TEXT,
                orderType VARCHAR(50) DEFAULT 'pos_sale',
                tableNumber VARCHAR(50),
                tokenNumber VARCHAR(50),
                notes TEXT
            )`);

            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'cashier'
            )`);

            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}settings (
                \`key\` VARCHAR(255) PRIMARY KEY,
                value TEXT
            )`);

            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                direction VARCHAR(20) NOT NULL,
                refNumber VARCHAR(100),
                date DATETIME NOT NULL,
                dueDate DATETIME,
                partyName VARCHAR(255) NOT NULL,
                description TEXT,
                amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
                status VARCHAR(20) NOT NULL,
                parentId INT,
                source VARCHAR(50),
                partnerId INT,
                fbrResponse TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}partners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(20) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                taxNumber VARCHAR(50),
                address TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await promisePool.query(`CREATE TABLE IF NOT EXISTS ${prefix}customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phoneNumber VARCHAR(50),
                cardNumber VARCHAR(100) UNIQUE,
                loyaltyPoints DECIMAL(10, 2) DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Safe column additions for legacy tables
            const safeAdd = async (tbl, col) => {
                try {
                    await promisePool.query(`ALTER TABLE ${prefix}${tbl} ADD COLUMN ${col}`);
                } catch (e) {
                    // Ignore column already exists errors
                }
            };

            await safeAdd('transactions', 'partnerId INT');
            await safeAdd('transactions', 'fbrResponse TEXT');

        } catch (err) {
            console.error(`Error initializing tenant tables for ${tenantId}:`, err);
        } finally {
            initResolve();
        }
    })();

    dbCache[tenantId] = db;
    return db;
};

module.exports = { getTenantDB };
