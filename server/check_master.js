const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Adjusted path to server root
const dbPath = path.join(__dirname, 'master.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT * FROM user_lookup", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("User Lookup:");
        rows.forEach(r => {
            console.log(`User: ${r.username}, Tenant: ${r.tenant_id}`);
        });
    }
});

db.all("SELECT * FROM tenants", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Tenants:");
        rows.forEach(r => {
            console.log(`ID: ${r.id}, Email: ${r.email}, Pass: ${r.password.substring(0,10)}...`);
        });
    }
});
