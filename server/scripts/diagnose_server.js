
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log("--- DIAGNOSTIC START ---");
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`CWD: ${process.cwd()}`);

// 1. Check .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    console.log("✅ .env file found");
    require('dotenv').config({ path: envPath });
} else {
    console.log("❌ .env file NOT found at " + envPath);
}

// 2. Check Environment Variables
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_MASTER_NAME'];
const missingVars = requiredVars.filter(k => !process.env[k]);
if (missingVars.length > 0) {
    console.log("❌ Missing Environment Variables:", missingVars.join(', '));
} else {
    console.log("✅ All required DB variables present");
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    console.log(`   DB_NAME: ${process.env.DB_MASTER_NAME}`);
}

// 3. Check Dependencies
try {
    require('mysql2');
    console.log("✅ mysql2 module found");
} catch (e) {
    console.log("❌ mysql2 module MISSING. Run 'npm install'");
}

try {
    require('express');
    console.log("✅ express module found");
} catch (e) {
    console.log("❌ express module MISSING. Run 'npm install'");
}

// 4. Test DB Connection
if (missingVars.length === 0) {
    console.log("Testing MySQL Connection...");
    const mysql = require('mysql2');
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_MASTER_NAME
    });

    connection.connect(err => {
        if (err) {
            console.log("❌ MySQL Connection Failed:", err.message);
        } else {
            console.log("✅ MySQL Connection Successful!");
            connection.end();
        }
    });
}

console.log("--- DIAGNOSTIC END ---");
