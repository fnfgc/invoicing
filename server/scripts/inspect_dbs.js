
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbs = [
    'pos.db',
    'master.db',
    'data/master.db',
    'data/tenant_1.db'
];

dbs.forEach(dbName => {
    const dbPath = path.resolve(__dirname, '..', dbName);
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.log(`[${dbName}] Does not exist or cannot open.`);
            return;
        }
        
        console.log(`\n--- Inspecting ${dbName} ---`);
        
        db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
            if (err) {
                console.log(`[${dbName}] Error listing tables:`, err.message);
                return;
            }
            
            if (tables.length === 0) {
                console.log(`[${dbName}] No tables found.`);
                return;
            }

            tables.forEach(table => {
                db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, row) => {
                    if (err) {
                        console.log(`[${dbName}] ${table.name}: Error counting rows`);
                    } else {
                        console.log(`[${dbName}] ${table.name}: ${row.count} rows`);
                        
                        // If it's the users table, list the usernames
                        if (table.name === 'users') {
                             db.all(`SELECT id, username, role FROM users`, [], (err, users) => {
                                 if (users) {
                                     console.log(`[${dbName}] users sample:`, JSON.stringify(users));
                                 }
                             });
                        }
                    }
                });
            });
        });
    });
});
