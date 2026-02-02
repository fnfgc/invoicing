const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
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
