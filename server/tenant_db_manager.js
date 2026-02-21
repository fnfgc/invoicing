
const mysql = require('mysql2');
const masterPool = require('./mysql_config');
require('dotenv').config();

const dbCache = {};

// Helper to modify SQL queries to use prefixed tables
const prefixTable = (sql, tenantId) => {
    const prefix = `tenant_${tenantId}_`;
    
    const tables = ['products', 'invoices', 'users', 'settings', 'transactions', 'partners'];
    let newSql = sql;
    
    tables.forEach(table => {
        // Replace "FROM table" -> "FROM prefix_table"
        // Replace "JOIN table" -> "JOIN prefix_table"
        // Replace "INTO table" -> "INTO prefix_table"
        // Replace "UPDATE table" -> "UPDATE prefix_table"
        // Use word boundaries to avoid replacing substrings
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

    // We use the SAME master pool for everyone now, but we intercept queries to rewrite table names
    const tenantPool = masterPool;

    // Wrapper to mimic SQLite API
    const db = {
        pool: tenantPool,
        run: (sql, params, callback) => {
             if (typeof params === 'function') { callback = params; params = []; }
             const prefixedSql = prefixTable(sql, tenantId);
             
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
        },
        get: (sql, params, callback) => {
             if (typeof params === 'function') { callback = params; params = []; }
             const prefixedSql = prefixTable(sql, tenantId);
             
             tenantPool.query(prefixedSql, params, (err, results) => {
                 if (err) return callback(err);
                 callback(null, results && results.length > 0 ? results[0] : undefined);
             });
        },
        all: (sql, params, callback) => {
             if (typeof params === 'function') { callback = params; params = []; }
             const prefixedSql = prefixTable(sql, tenantId);
             
             tenantPool.query(prefixedSql, params, (err, results) => {
                 callback(err, results);
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
                taxRate DECIMAL(5, 2) DEFAULT 17
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
                items TEXT
            )`);

            try {
                await promisePool.query(`ALTER TABLE ${prefix}invoices ADD COLUMN items TEXT`);
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') {}
            }

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

            try {
                await promisePool.query(`ALTER TABLE ${prefix}transactions ADD COLUMN partnerId INT`);
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') {}
            }

        } catch (err) {
            console.error(`Error initializing tenant tables for ${tenantId}:`, err);
        }
    })();

    dbCache[tenantId] = db;
    return db;
};

module.exports = { getTenantDB };
