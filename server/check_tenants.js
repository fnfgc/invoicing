const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/master.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Tables in master.db:", rows);
        db.all("SELECT id, business_name, slug, plan, is_active FROM tenants", (err, rows) => {
             if (err) console.error(err);
             else console.log("Tenants:", rows);
        });
    }
    db.close();
});
