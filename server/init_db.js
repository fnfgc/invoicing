const db = require('./master_db_sqlite');
console.log("Initializing SQLite DB...");
// db is already initialized when required, so we just wait a bit to ensure migrations run
setTimeout(() => {
    console.log("Done.");
}, 2000);
