const jwt = require('jsonwebtoken');
const { getTenantDB } = require('../tenant_db_manager');
const masterDB = require('../master_db');

const SECRET_KEY = process.env.JWT_SECRET || 'fnf_secure_key_2024';

const authMiddleware = (req, res, next) => {
    // 1. Get Token
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    try {
        // 2. Verify Token
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // { id, email, role, tenantId }

        // 3. Super Admin Check
        if (req.user.role === 'superadmin') {
            req.db = masterDB; // Super admin operates on Master DB usually
            return next();
        }

        // 4. Subscription Check (Query Master DB)
        masterDB.get("SELECT * FROM tenants WHERE id = ?", [req.user.tenantId], (err, tenant) => {
            if (err || !tenant) {
                return res.status(401).json({ error: "Tenant not found" });
            }

            if (!tenant.is_active) {
                return res.status(403).json({ error: "Account is inactive. Contact support." });
            }

            if (tenant.subscription_expiry && new Date(tenant.subscription_expiry) < new Date()) {
                return res.status(403).json({ error: "Subscription expired. Please renew." });
            }

            // 5. Attach Tenant DB
            try {
                req.db = getTenantDB(req.user.tenantId);
                next();
            } catch (dbErr) {
                console.error("DB Init Error:", dbErr);
                res.status(500).json({ error: "Failed to connect to business database" });
            }
        });

    } catch (err) {
        res.status(401).json({ error: "Invalid Token" });
    }
};

module.exports = { authMiddleware, SECRET_KEY };
