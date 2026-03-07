
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const run = (sql) => new Promise((resolve, reject) => {
    db.run(sql, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

async function migrate() {
    try {
        console.log("Checking 'packages' table schema...");
        
        // Check for columns
        const columns = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(packages)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.name));
            });
        });

        console.log("Existing columns:", columns);

        if (!columns.includes('ai_enabled')) {
            console.log("Adding ai_enabled column...");
            await run("ALTER TABLE packages ADD COLUMN ai_enabled INTEGER DEFAULT 0");
        }
        
        if (!columns.includes('accounting_enabled')) {
            console.log("Adding accounting_enabled column...");
            await run("ALTER TABLE packages ADD COLUMN accounting_enabled INTEGER DEFAULT 1");
        }

        if (!columns.includes('website_enabled')) {
            console.log("Adding website_enabled column...");
            await run("ALTER TABLE packages ADD COLUMN website_enabled INTEGER DEFAULT 1");
        }

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        db.close();
    }
}

migrate();
