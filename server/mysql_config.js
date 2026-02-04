const mysql = require('mysql2');
const path = require('path');

// --- ROBUST ENV LOADING ---
// Try loading .env from current directory AND from server directory to be safe
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });
// Also try default lookup just in case
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_MASTER_NAME || 'invoicing_master',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Allow multiple statements for initialization scripts
});

// Wrapper to support Promise-based queries if needed, 
// but we'll export the standard pool for now.
module.exports = pool;
