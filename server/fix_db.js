const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/master.db');

db.serialize(() => {
    // Check columns in tenants table
    db.all("PRAGMA table_info(tenants)", (err, rows) => {
        if (err) console.error("PRAGMA error:", err);
        else console.log("Tenants Columns:", rows.map(r => r.name));
    });

    // Fix Null Slugs
    db.all("SELECT id, business_name FROM tenants WHERE slug IS NULL", (err, rows) => {
        if (err) {
            console.error("Select error:", err);
            return;
        }
        console.log(`Found ${rows.length} tenants with null slug`);
        rows.forEach(row => {
            let slug = row.business_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            if (!slug) slug = 'store';
            slug = slug + '-' + row.id;
            console.log(`Updating tenant ${row.id} with slug: ${slug}`);
            db.run("UPDATE tenants SET slug = ? WHERE id = ?", [slug, row.id], (err) => {
                if (err) console.error("Update error:", err);
                else console.log("Update success");
            });
        });
    });

    // Verify final state
    setTimeout(() => {
        db.all("SELECT id, business_name, slug, website_enabled FROM tenants", (err, rows) => {
            if (err) console.error(err);
            else console.log("Final Tenants State:", rows);
        });
    }, 1000);
});
