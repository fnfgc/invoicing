
const db = require('../master_db');

console.log("Starting Accounting Packages Migration...");

// Wait for DB to initialize
setTimeout(async () => {
    try {
        console.log("DB Mode:", db.getMode());

        // 1. Add accounting_enabled column
        const addColumn = (query) => {
            return new Promise((resolve) => {
                db.run(query, (err) => {
                    if (err) {
                        const msg = err.message || err.toString();
                        if (msg.includes('duplicate') || msg.includes('exists')) {
                            console.log("Column accounting_enabled already exists.");
                        } else {
                            console.warn("Potential error adding column:", msg);
                        }
                    } else {
                        console.log("Added accounting_enabled column.");
                    }
                    resolve();
                });
            });
        };

        // Try generic syntax first (Works for SQLite and often MySQL)
        await addColumn("ALTER TABLE packages ADD COLUMN accounting_enabled INTEGER DEFAULT 1");

        // 2. Ensure all existing packages have accounting enabled (since they were created before this restriction)
        db.run("UPDATE packages SET accounting_enabled = 1 WHERE accounting_enabled IS NULL OR accounting_enabled = ''");

        console.log("Migration commands queued.");
        
        // Give it some time to finish
        setTimeout(() => {
            console.log("Done.");
            process.exit(0);
        }, 2000);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}, 2000);
