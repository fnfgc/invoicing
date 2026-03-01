
const pool = require('./mysql_config');

let impl = null;
const queue = [];

// Determine DB Mode and Initialize
(async () => {
    try {
        // Test MySQL Connection with a simple query
        await pool.promise().query('SELECT 1');
        console.log("✅ MySQL Connected: Using Master DB (MySQL)");
        impl = require('./master_db_mysql');
        // Initialize Schema
        if (impl.initDB) await impl.initDB();
    } catch (e) {
        console.warn("⚠️ MySQL Connection Failed:", e.message);
        console.log("🔄 Falling back to SQLite for Master DB");
        impl = require('./master_db_sqlite');
        // SQLite impl initializes itself on require usually, or we call init if exposed
        if (impl.initDB) impl.initDB();
    }
    
    // Process any queued operations
    if (queue.length > 0) {
        console.log(`Processing ${queue.length} queued DB operations...`);
        queue.forEach(task => task());
        queue.length = 0;
    }
})();

// Export Proxy Interface
module.exports = {
    run: (...args) => {
        if (impl) return impl.run(...args);
        queue.push(() => impl.run(...args));
    },
    get: (...args) => {
        if (impl) return impl.get(...args);
        queue.push(() => impl.get(...args));
    },
    all: (...args) => {
        if (impl) return impl.all(...args);
        queue.push(() => impl.all(...args));
    },
    // Expose which mode we are in (helper)
    getMode: () => impl ? (impl.initDB ? 'mysql' : 'sqlite') : 'pending'
};
