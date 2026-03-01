
const db = require('../master_db');

console.log("Starting AI Packages Migration...");

// Wait for DB to initialize (it's async inside master_db.js)
setTimeout(async () => {
    try {
        console.log("DB Mode:", db.getMode());

        // 1. Add ai_enabled column
        try {
            await new Promise((resolve, reject) => {
                db.run("ALTER TABLE packages ADD COLUMN ai_enabled INTEGER DEFAULT 0", (err) => {
                    if (err) {
                        // Ignore if column exists (MySQL vs SQLite error messages differ)
                        if (err.message && (err.message.includes('duplicate') || err.message.includes('exists'))) {
                            console.log("Column ai_enabled already exists.");
                            resolve();
                        } else {
                            console.warn("Potential error adding column (might already exist):", err.message);
                            resolve(); // Continue anyway
                        }
                    } else {
                        console.log("Added ai_enabled column.");
                        resolve();
                    }
                });
            });
        } catch (e) {
            console.log("Skipping add column (error or exists).");
        }

        // 2. Update existing packages
        // Trial
        db.run("UPDATE packages SET ai_enabled = 0 WHERE name = 'Trial'");

        // Monthly -> Monthly (Standard)
        db.run("UPDATE packages SET name = 'Monthly (Standard)', ai_enabled = 0, price = 19.99 WHERE name = 'Monthly'");
        db.run("UPDATE tenants SET plan = 'Monthly (Standard)' WHERE plan = 'Monthly'");

        // Yearly -> Yearly (Standard)
        db.run("UPDATE packages SET name = 'Yearly (Standard)', ai_enabled = 0, price = 199.99 WHERE name = 'Yearly'");
        db.run("UPDATE tenants SET plan = 'Yearly (Standard)' WHERE plan = 'Yearly'");

        // 3. Insert New AI Packages
        // We need to check if they exist first to avoid duplicates
        // But since we can't easily do "INSERT IGNORE" across both DBs with same syntax,
        // we'll try to fetch first.
        
        const checkAndInsert = (name, price, days, features, ai) => {
            db.get("SELECT id FROM packages WHERE name = ?", [name], (err, row) => {
                if (!row) {
                    const featuresStr = JSON.stringify(features);
                    db.run("INSERT INTO packages (name, price, duration_days, features, ai_enabled) VALUES (?, ?, ?, ?, ?)", 
                        [name, price, days, featuresStr, ai], 
                        (err) => {
                            if (err) console.error(`Failed to insert ${name}:`, err.message);
                            else console.log(`Created package: ${name}`);
                        }
                    );
                } else {
                    console.log(`Package ${name} already exists.`);
                }
            });
        };

        checkAndInsert("Monthly (AI Pro)", 39.99, 30, ["Unlimited POS", "Unlimited Products", "AI Insights", "Voice Commands", "Priority Support"], 1);
        checkAndInsert("Yearly (AI Pro)", 399.99, 365, ["All Features + AI", "Priority Support"], 1);

        console.log("Migration commands queued.");
        
        // Give it some time to finish
        setTimeout(() => {
            console.log("Done.");
            process.exit(0);
        }, 3000);

    } catch (err) {
        console.error("Migration Failed:", err);
        process.exit(1);
    }
}, 2000);
