const masterDB = require('./master_db');

console.log("Checking Master DB...");

masterDB.all("SELECT * FROM user_lookup", (err, rows) => {
    if (err) {
        console.error("Error fetching user_lookup:", err);
    } else {
        console.log("User Lookup:");
        if (rows) {
            rows.forEach(r => {
                console.log(`User: ${r.username}, Tenant: ${r.tenant_id}`);
            });
        } else {
            console.log("No users found.");
        }
    }
});

masterDB.all("SELECT * FROM tenants", (err, rows) => {
    if (err) {
        console.error("Error fetching tenants:", err);
    } else {
        console.log("Tenants:");
        if (rows) {
            rows.forEach(r => {
                console.log(`ID: ${r.id}, Email: ${r.email}, Pass: ${r.password ? r.password.substring(0,10) + '...' : 'N/A'}`);
            });
        } else {
            console.log("No tenants found.");
        }
    }
    
    // Exit after a brief delay to allow queries to finish
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});
