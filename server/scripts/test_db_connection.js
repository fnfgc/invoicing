
const mysql = require('mysql2');
const path = require('path');
// Load .env from the parent server directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Load environment variables (User must set these in .env or provide them)
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_MASTER_NAME || 'u431059398_posfbr',
    port: process.env.DB_PORT || 3306
};

console.log("---------------------------------------------------");
console.log("MySQL Connection Test Script");
console.log("---------------------------------------------------");
console.log(`Host: ${config.host}`);
console.log(`User: ${config.user}`);
console.log(`Database: ${config.database}`);
console.log("---------------------------------------------------");

if (!config.host || !config.user) {
    console.error("ERROR: DB_HOST or DB_USER not set in .env file.");
    process.exit(1);
}

const connection = mysql.createConnection(config);

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection Failed:', err.message);
        console.error('Stack:', err.stack);
        return;
    }
    console.log('✅ Connected to MySQL Database successfully!');

    // Test 1: Check Master Tables
    console.log("\nTesting Master Tables...");
    connection.query('SELECT count(*) as count FROM tenants', (err, results) => {
        if (err) console.error('❌ Failed to query tenants:', err.message);
        else console.log(`✅ Found ${results[0].count} tenants.`);

        connection.query('SELECT * FROM user_lookup LIMIT 5', (err, results) => {
            if (err) console.error('❌ Failed to query user_lookup:', err.message);
            else {
                console.log(`✅ Found ${results.length} users in user_lookup.`);
                results.forEach(u => console.log(`   - ${u.username} (Tenant ID: ${u.tenant_id})`));
            }

            // Test 2: Check Tenant 1 Tables
            console.log("\nTesting Tenant 1 Tables (Prefix Strategy)...");
            connection.query('SELECT count(*) as count FROM tenant_1_products', (err, results) => {
                if (err) {
                    console.error('❌ Failed to query tenant_1_products:', err.message);
                    console.log("   (Maybe the table prefix is wrong or table doesn't exist?)");
                } else {
                    console.log(`✅ Found ${results[0].count} products in tenant_1_products.`);
                }

                connection.query('SELECT count(*) as count FROM tenant_1_users', (err, results) => {
                    if (err) console.error('❌ Failed to query tenant_1_users:', err.message);
                    else console.log(`✅ Found ${results[0].count} users in tenant_1_users.`);
                    
                    connection.end();
                });
            });
        });
    });
});
