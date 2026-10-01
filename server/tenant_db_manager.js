
const pool = require('./mysql_config');
let impl = null;

// Determine Tenant DB Mode (MySQL vs SQLite)
(async () => {
    try {
        await pool.promise().query('SELECT 1');
        console.log("✅ Using MySQL for Tenant DBs");
        impl = require('./tenant_db_manager_mysql');
    } catch (e) {
        console.warn("⚠️ MySQL Failed for Tenant DBs:", e.message);
        console.log("🔄 Using SQLite for Tenant DBs");
        impl = require('./tenant_db_manager_sqlite');
    }
})();

module.exports = {
    getTenantDB: (tenantId) => {
        if (!impl) {
            // When MySQL env is configured, default directly to MySQL implementation
            if (process.env.DB_HOST) {
                impl = require('./tenant_db_manager_mysql');
            } else {
                console.warn("Tenant DB Manager called before initialization - assuming SQLite fallback.");
                try {
                    impl = require('./tenant_db_manager_sqlite');
                } catch (err) {
                    throw new Error("DB Manager Not Initialized and SQLite fallback failed.");
                }
            }
        }
        return impl.getTenantDB(tenantId);
    }
};

