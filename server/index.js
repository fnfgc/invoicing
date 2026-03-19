const voiceService = require('./voice_service');
const analyticsService = require('./analytics_service');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sendToFBR } = require('./fbr');
const masterDB = require('./master_db'); // Proxy DB (Smart Selection)
const { getTenantDB } = require('./tenant_db_manager'); // Proxy Manager
const { authMiddleware, SECRET_KEY } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const pool = require('./mysql_config'); // Import raw pool for connection testing

// --- ROBUST ENV LOADING ---
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });
require('dotenv').config();

// --- STARTUP LOGGING ---
console.log("Starting Server Initialization...");
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    // Do not exit immediately, let the fallback server handle if possible, 
    // but usually uncaught exception implies unstable state.
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const fs = require('fs');
if (process.env.GOOGLE_CREDENTIALS_PATH || fs.existsSync(path.join(__dirname, '../google-credentials.json'))) {
    try {
        const { startBackupService } = require('./services/backupService');
        startBackupService();
    } catch (err) {
        console.warn("Backup service disabled:", err.message);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- HEALTH CHECK (No DB) ---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        env_loaded: !!process.env.DB_HOST,
        cwd: process.cwd(),
        dirname: __dirname
    });
});

// --- System Activation Check (Public) ---
app.get('/api/activation/status', (req, res) => {
    res.json({ activated: true, expired: false });
});

// --- Tenant Resolution (Public) ---
app.get('/api/tenant/resolve', (req, res) => {
    const { domain, slug } = req.query;
    if (!domain && !slug) return res.status(400).json({ error: "Domain or slug is required" });

    let sql = "SELECT id, business_name, plan, is_active, slug FROM tenants WHERE ";
    let params = [];

    if (domain) {
        sql += "custom_domain = ?";
        params.push(domain);
    } else {
        sql += "slug = ?";
        params.push(slug);
    }

    masterDB.get(sql, params, (err, tenant) => {
        if (err) {
            console.error("Tenant Resolution Error:", err);
            return res.status(500).json({ error: "Server Error" });
        }
        
        if (tenant) {
            return res.json({ 
                found: true, 
                tenant: {
                    id: tenant.id,
                    name: tenant.business_name,
                    plan: tenant.plan,
                    slug: tenant.slug
                }
            });
        }
        
        res.json({ found: false });
    });
});

// --- PUBLIC STORE MIDDLEWARE & ROUTES ---
const publicStoreMiddleware = (req, res, next) => {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: "Store slug required" });

    // Find tenant by slug and check package permissions
    const sql = `
        SELECT t.*, p.website_enabled as package_allows_website 
        FROM tenants t 
        LEFT JOIN packages p ON t.plan = p.name 
        WHERE t.slug = ?
    `;

    masterDB.get(sql, [slug], (err, tenant) => {
        if (err) {
            console.error("Store Lookup Error:", err);
            return res.status(500).json({ error: "Store lookup failed" });
        }
        if (!tenant) {
            return res.status(404).json({ error: "Store not found" });
        }

        if (!tenant.is_active) {
            return res.status(403).json({ error: "Store is currently inactive" });
        }

        // Attach flags to request for route-level checks
        req.websiteEnabled = !!tenant.website_enabled;
        req.packageAllowsWebsite = tenant.package_allows_website !== 0; // Default to true if null (1 or null)

        try {
            // Attach Tenant DB
            req.db = getTenantDB(tenant.id);
            req.tenant = tenant;
            next();
        } catch (dbErr) {
            console.error("Store DB Error:", dbErr);
            res.status(500).json({ error: "Store database unavailable" });
        }
    });
};

app.get('/api/store/:slug/products', publicStoreMiddleware, (req, res) => {
    // Enforce Website Disabled Policy
    if (!req.websiteEnabled || !req.packageAllowsWebsite) {
        return res.status(503).json({ error: "Store is currently offline" });
    }

    const sql = "SELECT id, name, price, stock, category, image, description FROM products WHERE stock > 0 ORDER BY category, name";
    req.db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/store/:slug/info', publicStoreMiddleware, (req, res) => {
    // We ALLOW info to be fetched even if disabled, so the frontend can show "Maintenance Mode"
    // But we must return the flags
    
    const sql = "SELECT * FROM settings";
    req.db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const settings = {};
        if (rows) {
            rows.forEach(row => {
                settings[row.key] = row.value;
            });
        }

        // Return public-safe settings
        res.json({
            business_name: settings.business_name,
            business_address: settings.business_address,
            business_contact: settings.business_contact,
            business_ntn: settings.business_ntn,
            // CMS Settings
            website_banner: settings.website_banner,
            website_theme_color: settings.website_theme_color,
            website_welcome_title: settings.website_welcome_title,
            website_welcome_message: settings.website_welcome_message,
            website_about: settings.website_about,
            website_instagram: settings.website_instagram,
            website_facebook: settings.website_facebook,
            
            // Feature Flags
            website_enabled: req.websiteEnabled,
            package_allows_website: req.packageAllowsWebsite,
            
            slug: req.tenant.slug,
            id: req.tenant.id,
            plan: req.tenant.plan
        });
    });
});

app.post('/api/store/:slug/order', publicStoreMiddleware, (req, res) => {
    // Enforce Website Disabled Policy
    if (!req.websiteEnabled || !req.packageAllowsWebsite) {
        return res.status(503).json({ error: "Store is currently offline" });
    }
    const { items, customer } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
    }
    if (!customer || !customer.phone) {
        return res.status(400).json({ error: "Customer phone is required" });
    }

    const db = req.db;
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0; // Simplified for public store for now, or fetch from settings
    const total = subtotal + tax;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Create/Find Customer (Simplified)
        // We'll just store the name/phone in the invoice for now or create a walk-in customer
        // Ideally check if customer exists by phone
        
        db.get("SELECT id FROM customers WHERE phone = ?", [customer.phone], (err, row) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Database error" });
            }

            let customerId = row ? row.id : null;
            
            const proceedWithOrder = (custId) => {
                // 2. Create Invoice
                const invoiceSql = `INSERT INTO invoices (customer_id, total_amount, discount, payment_method, notes, date) 
                                    VALUES (?, ?, 0, 'COD', ?, datetime('now'))`;
                const notes = `Online Order from ${customer.name || 'Guest'} (${customer.address || 'No Address'})`;
                
                db.run(invoiceSql, [custId, total, notes], function(err) {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: err.message });
                    }
                    
                    const invoiceId = this.lastID;
                    const invoiceNumber = `INV-${invoiceId.toString().padStart(6, '0')}`; // Simple generation

                    // 3. Insert Items & Update Stock
                    const stmt = db.prepare("INSERT INTO invoice_items (invoice_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)");
                    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

                    let errorOccurred = false;

                    items.forEach(item => {
                        stmt.run(invoiceId, item.id, item.quantity, item.price, item.price * item.quantity, (err) => {
                            if (err) errorOccurred = true;
                        });
                        updateStock.run(item.quantity, item.id, (err) => {
                             if (err) errorOccurred = true;
                        });
                    });

                    stmt.finalize();
                    updateStock.finalize();

                    if (errorOccurred) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: "Failed to save order items" });
                    }

                    db.run("COMMIT");
                    res.json({ success: true, orderId: invoiceNumber, message: "Order placed successfully!" });
                });
            };

            if (!customerId) {
                // Create new customer
                db.run("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)", 
                    [customer.name || 'Guest', customer.phone, customer.address || ''], 
                    function(err) {
                        if (err) {
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: "Failed to create customer" });
                        }
                        proceedWithOrder(this.lastID);
                    }
                );
            } else {
                proceedWithOrder(customerId);
            }
        });
    });
});

// --- Auth Routes (Public) ---

// Login (SaaS: Tenant or SuperAdmin)
app.post('/api/login', (req, res) => {
    const emailOrUsername = req.body.email || req.body.username;
    const password = req.body.password;

    if (!emailOrUsername || !password) {
        return res.status(400).json({ error: "Username/Email and Password are required" });
    }

    // 1. Check Master DB for Tenants
    masterDB.get("SELECT * FROM tenants WHERE email = ?", [emailOrUsername], (err, tenant) => {
        if (err) {
            console.error("Login Error (MasterDB):", err);
            return res.status(500).json({ error: "Server Error" });
        }
        
        if (tenant) {
            if (!bcrypt.compareSync(password, tenant.password)) {
                return res.status(401).json({ error: "Invalid Credentials" });
            }

            if (!tenant.is_active) {
                return res.status(403).json({ error: "Account is pending activation. Please wait for admin approval." });
            }

            const role = (tenant.email === 'superadmin@fnf.com') ? 'superadmin' : 'owner';

            // Fetch package details to get capabilities + pricing
            masterDB.get("SELECT ai_enabled, accounting_enabled, price FROM packages WHERE name = ?", [tenant.plan], (err, pkg) => {
                const aiEnabled = pkg ? !!pkg.ai_enabled : false;
                // Default to true if undefined (backward compatibility)
                const accountingEnabled = pkg && (pkg.accounting_enabled !== undefined && pkg.accounting_enabled !== null) ? !!pkg.accounting_enabled : true;
                const planPrice = pkg && pkg.price !== undefined && pkg.price !== null ? Number(pkg.price) : null;

                const subscriptionExpiry = tenant.subscription_expiry || null;
                const subscriptionExpired = subscriptionExpiry ? (new Date(subscriptionExpiry) < new Date()) : false;

                const token = jwt.sign({ 
                    id: tenant.id, 
                    tenantId: tenant.id, 
                    role: role, 
                    email: tenant.email,
                    aiEnabled: aiEnabled,
                    accountingEnabled: accountingEnabled
                }, SECRET_KEY, { expiresIn: '24h' });

                return res.json({ 
                    success: true, 
                    token, 
                    role: role, 
                    name: tenant.business_name, 
                    aiEnabled, 
                    accountingEnabled,
                    planName: tenant.plan || null,
                    planPrice,
                    subscriptionExpiry,
                    subscriptionExpired
                });
            });
        }
        
        // If not found in Master DB, check User Lookup
        masterDB.get("SELECT tenant_id FROM user_lookup WHERE username = ?", [emailOrUsername], (err, lookup) => {
            if (err) {
                console.error("Login Error (UserLookup):", err);
                return res.status(500).json({ error: "Server Error" });
            }
            
            if (!lookup) {
                return res.status(401).json({ error: "User not found or invalid credentials" });
            }

            try {
                const tenantDB = getTenantDB(lookup.tenant_id);
                tenantDB.get("SELECT * FROM users WHERE username = ?", [emailOrUsername], (err, user) => {
                    if (err) {
                        console.error("Login Error (TenantDB):", err);
                        return res.status(500).json({ error: "Database Error" });
                    }
                    if (!user) return res.status(401).json({ error: "User not found in tenant DB" });

                    if (!bcrypt.compareSync(password, user.password)) {
                        return res.status(401).json({ error: "Invalid Credentials" });
                    }

                    masterDB.get("SELECT is_active, plan, subscription_expiry FROM tenants WHERE id = ?", [lookup.tenant_id], (err, tenantInfo) => {
                        if (tenantInfo && !tenantInfo.is_active) {
                            return res.status(403).json({ error: "Business account is inactive." });
                        }

                        // Fetch package details
                        masterDB.get("SELECT ai_enabled, accounting_enabled, price FROM packages WHERE name = ?", [tenantInfo.plan], (err, pkg) => {
                            const aiEnabled = pkg ? !!pkg.ai_enabled : false;
                            const accountingEnabled = pkg && (pkg.accounting_enabled !== undefined && pkg.accounting_enabled !== null) ? !!pkg.accounting_enabled : true;
                            const planPrice = pkg && pkg.price !== undefined && pkg.price !== null ? Number(pkg.price) : null;

                            const subscriptionExpiry = tenantInfo?.subscription_expiry || null;
                            const subscriptionExpired = subscriptionExpiry ? (new Date(subscriptionExpiry) < new Date()) : false;

                            const token = jwt.sign({ 
                                id: user.id, 
                                tenantId: lookup.tenant_id, 
                                role: user.role, 
                                username: user.username,
                                aiEnabled: aiEnabled,
                                accountingEnabled: accountingEnabled
                            }, SECRET_KEY, { expiresIn: '24h' });

                            return res.json({ 
                                success: true, 
                                token, 
                                role: user.role, 
                                name: user.name, 
                                aiEnabled, 
                                accountingEnabled,
                                planName: tenantInfo?.plan || null,
                                planPrice,
                                subscriptionExpiry,
                                subscriptionExpired
                            });
                        });
                    });
                });
            } catch (e) {
                console.error("Login Critical Error:", e);
                return res.status(500).json({ error: "Failed to access tenant database" });
            }
        });
    });
});

// --- Tenant Settings Routes (Protected) ---
app.put('/api/tenant/website-status', authMiddleware, (req, res) => {
    const { enabled } = req.body;
    
    // Check if package allows it first
    masterDB.get("SELECT plan FROM tenants WHERE id = ?", [req.user.tenantId], (err, tenant) => {
        if (err || !tenant) return res.status(500).json({ error: "Tenant lookup failed" });
        
        masterDB.get("SELECT website_enabled FROM packages WHERE name = ?", [tenant.plan], (err, pkg) => {
             if (err) return res.status(500).json({ error: "Package lookup failed" });
             
             // If trying to enable, check package permission
             if (enabled && pkg && pkg.website_enabled === 0) {
                 return res.status(403).json({ error: "Your current plan does not include a website." });
             }
             
             masterDB.run("UPDATE tenants SET website_enabled = ? WHERE id = ?", [enabled ? 1 : 0, req.user.tenantId], (err) => {
                 if (err) return res.status(500).json({ error: "Failed to update website status" });
                 res.json({ success: true, website_enabled: !!enabled });
             });
        });
    });
});

// Super Admin Routes (Protected)

app.get('/api/payment-instructions', (req, res) => {
    masterDB.get("SELECT `value` as value FROM system_settings WHERE `key` = ?", ["payment_instructions"], (err, row) => {
        if (err) {
            return res.json({
                bankName: "HBL",
                accountTitle: "FAIZAN RASHEED",
                accountNumber: "22207902038103",
                iban: "PK08HABB0022207902038103",
                branch: "FAISALABAD-AKBAR CHO",
                email: "info@fnfgc.com"
            });
        }
        if (!row || !row.value) {
            return res.json({
                bankName: "HBL",
                accountTitle: "FAIZAN RASHEED",
                accountNumber: "22207902038103",
                iban: "PK08HABB0022207902038103",
                branch: "FAISALABAD-AKBAR CHO",
                email: "info@fnfgc.com"
            });
        }
        try {
            const parsed = JSON.parse(row.value);
            return res.json(parsed);
        } catch {
            return res.json({
                bankName: "HBL",
                accountTitle: "FAIZAN RASHEED",
                accountNumber: "22207902038103",
                iban: "PK08HABB0022207902038103",
                branch: "FAISALABAD-AKBAR CHO",
                email: "info@fnfgc.com"
            });
        }
    });
});

app.get('/api/admin/payment-instructions', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
    masterDB.get("SELECT `value` as value FROM system_settings WHERE `key` = ?", ["payment_instructions"], (err, row) => {
        if (err) return res.json({});
        if (!row || !row.value) return res.json({});
        try {
            return res.json(JSON.parse(row.value));
        } catch {
            return res.json({});
        }
    });
});

app.put('/api/admin/payment-instructions', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
    const next = {
        bankName: req.body.bankName || "",
        accountTitle: req.body.accountTitle || "",
        accountNumber: req.body.accountNumber || "",
        iban: req.body.iban || "",
        branch: req.body.branch || "",
        email: req.body.email || ""
    };
    const valueStr = JSON.stringify(next);
    const ensureTable = (cb) => {
        masterDB.run(
            "CREATE TABLE IF NOT EXISTS system_settings (`key` VARCHAR(255) PRIMARY KEY, `value` TEXT)",
            (err) => {
                if (!err) return cb();
                masterDB.run(
                    "CREATE TABLE IF NOT EXISTS system_settings (key TEXT PRIMARY KEY, value TEXT)",
                    () => cb()
                );
            }
        );
    };
    ensureTable(() => {
        masterDB.run(
            "INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
            ["payment_instructions", valueStr],
            function(err) {
                if (!err) return res.json({ success: true });
                masterDB.run(
                    "INSERT OR REPLACE INTO system_settings (`key`, `value`) VALUES (?, ?)",
                    ["payment_instructions", valueStr],
                    function(err2) {
                        if (err2) return res.status(500).json({ error: err2.message });
                        res.json({ success: true });
                    }
                );
            }
        );
    });
});

app.get('/api/packages', (req, res) => {
    masterDB.all("SELECT * FROM packages", (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(rows);
    });
});

app.post('/api/packages', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
    
    const { name, price, duration_days, features, ai_enabled, accounting_enabled, website_enabled } = req.body;
    masterDB.run("INSERT INTO packages (name, price, duration_days, features, ai_enabled, accounting_enabled, website_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, price, duration_days, JSON.stringify(features), ai_enabled ? 1 : 0, accounting_enabled ? 1 : 0, website_enabled ? 1 : 0],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
    });
});

app.put('/api/packages/:id', authMiddleware, (req, res) => {
  if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
  
  const { id } = req.params;
  const { name, price, duration_days, features, ai_enabled, accounting_enabled, website_enabled } = req.body;
  
  masterDB.run(
    "UPDATE packages SET name = ?, price = ?, duration_days = ?, features = ?, ai_enabled = ?, accounting_enabled = ?, website_enabled = ? WHERE id = ?",
    [name, price, duration_days, JSON.stringify(features), ai_enabled ? 1 : 0, accounting_enabled ? 1 : 0, website_enabled ? 1 : 0, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Package updated" });
    }
  );
});

app.delete('/api/packages/:id', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
    
    masterDB.run("DELETE FROM packages WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.post('/api/admin/tenants', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') {
        return res.status(403).json({ error: "Forbidden. Super Admin only." });
    }

    const { business_name, email, password, packageId } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    
    masterDB.get("SELECT * FROM packages WHERE id = ?", [packageId], (err, pkg) => {
        if (err || !pkg) return res.status(400).json({ error: "Invalid Package" });
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + pkg.duration_days);

        masterDB.run(`INSERT INTO tenants (business_name, email, password, plan, subscription_expiry) 
                      VALUES (?, ?, ?, ?, ?)`, 
                      [business_name, email, hash, pkg.name, expiry.toISOString()], 
                      function(err) {
            if (err) return res.status(400).json({ error: err.message });
            
            try {
                getTenantDB(this.lastID); 
                res.json({ success: true, id: this.lastID });
            } catch (e) {
                res.status(500).json({ error: "Tenant created but DB init failed" });
            }
        });
    });
});

app.get('/api/admin/tenants', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
    
    masterDB.all("SELECT id, business_name, email, plan, subscription_expiry, is_active FROM tenants", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/admin/tenants/:id', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const { business_name, email, password, packageId } = req.body;

    let query = "UPDATE tenants SET business_name = ?, email = ?";
    let params = [business_name, email];

    if (password && password.trim() !== "") {
        const hash = bcrypt.hashSync(password, 10);
        query += ", password = ?";
        params.push(hash);
    }

    const finalizeUpdate = () => {
        query += " WHERE id = ?";
        params.push(id);

        masterDB.run(query, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Tenant updated successfully" });
        });
    };

    if (packageId) {
        masterDB.get("SELECT * FROM packages WHERE id = ?", [packageId], (err, pkg) => {
            if (!err && pkg) {
                query += ", plan = ?";
                params.push(pkg.name);
                finalizeUpdate();
            } else {
                finalizeUpdate();
            }
        });
    } else {
        finalizeUpdate();
    }
});

app.delete('/api/admin/tenants/:id', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    masterDB.run("DELETE FROM tenants WHERE id = ?", [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Tenant deleted successfully" });
    });
});

app.put('/api/admin/tenants/:id/activate', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });

    masterDB.run("UPDATE tenants SET is_active = 1 WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Tenant activated successfully" });
    });
});

app.put('/api/admin/tenants/:id/renew', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    masterDB.get("SELECT * FROM tenants WHERE id = ?", [id], (err, tenant) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!tenant) return res.status(404).json({ error: "Tenant not found" });

        masterDB.get("SELECT duration_days FROM packages WHERE name = ?", [tenant.plan], (pkgErr, pkg) => {
            if (pkgErr) return res.status(500).json({ error: pkgErr.message });
            const duration = pkg ? Number(pkg.duration_days) : 30;

            const now = new Date();
            let base = tenant.subscription_expiry ? new Date(tenant.subscription_expiry) : now;
            if (Number.isNaN(base.getTime()) || base < now) base = now;

            base.setDate(base.getDate() + (Number.isFinite(duration) ? duration : 30));

            masterDB.run(
                "UPDATE tenants SET subscription_expiry = ?, is_active = 1 WHERE id = ?",
                [base.toISOString(), tenant.id],
                function(updateErr) {
                    if (updateErr) return res.status(500).json({ error: "Failed to renew subscription" });
                    res.json({ success: true, new_expiry: base.toISOString(), message: "Subscription renewed successfully" });
                }
            );
        });
    });
});

// Public Registration
app.post('/api/register', (req, res) => {
    const { business_name, email, password, packageId } = req.body;
    
    if (!business_name || !email || !password || !packageId) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const hash = bcrypt.hashSync(password, 10);
    
    // Generate slug
    let slug = business_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) slug = 'store';
    // Append timestamp to ensure uniqueness
    slug = `${slug}-${Date.now().toString(36)}`;
    
    masterDB.get("SELECT * FROM packages WHERE id = ?", [packageId], (err, pkg) => {
        if (err || !pkg) return res.status(400).json({ error: "Invalid Package" });
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + pkg.duration_days);

        masterDB.run(`INSERT INTO tenants (business_name, email, password, plan, subscription_expiry, is_active, slug) 
                      VALUES (?, ?, ?, ?, ?, 0, ?)`, 
                      [business_name, email, hash, pkg.name, expiry.toISOString(), slug], 
                      function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Email already registered" });
                return res.status(500).json({ error: err.message });
            }
            
            try {
                getTenantDB(this.lastID); 
                res.json({ success: true, id: this.lastID, message: "Registration successful. Please complete payment." });
            } catch (e) {
                res.status(500).json({ error: "Tenant created but DB init failed" });
            }
        });
    });
});

app.post('/api/subscription/renew', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ error: "Only the Business Owner can renew subscription." });
    }

    masterDB.get("SELECT * FROM tenants WHERE id = ?", [req.user.tenantId], (err, tenant) => {
        if (err || !tenant) return res.status(404).json({ error: "Tenant not found" });

        masterDB.get("SELECT * FROM packages WHERE name = ?", [tenant.plan], (err, pkg) => {
            const duration = pkg ? pkg.duration_days : 30;
            
            let currentExpiry = new Date(tenant.subscription_expiry);
            if (currentExpiry < new Date()) {
                currentExpiry = new Date();
            }
            currentExpiry.setDate(currentExpiry.getDate() + duration);

            masterDB.run("UPDATE tenants SET subscription_expiry = ?, is_active = 1 WHERE id = ?", 
                [currentExpiry.toISOString(), tenant.id], 
                function(err) {
                    if (err) return res.status(500).json({ error: "Failed to renew subscription" });
                    res.json({ success: true, new_expiry: currentExpiry, message: "Subscription Renewed Successfully" });
                }
            );
        });
    });
});

// --- Tenant Routes ---

app.get('/api/products', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM products", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', authMiddleware, (req, res) => {
    const { name, price, stock, pctCode, taxRate } = req.body;
    req.db.run("INSERT INTO products (name, price, stock, pctCode, taxRate) VALUES (?, ?, ?, ?, ?)", 
        [name, price, stock, pctCode, taxRate || 17.0], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.post('/api/products/import', authMiddleware, async (req, res) => {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: "Invalid data format. Expected 'products' array." });
    }

    let successCount = 0;
    let errors = [];

    const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
        req.db.run(sql, params, (err) => err ? reject(err) : resolve());
    });

    try {
        await runAsync("START TRANSACTION");

        for (let i = 0; i < products.length; i++) {
            const prod = products[i] || {};

            const name = prod.name || prod.Name || prod['Product Name'] || prod.product_name || "Unknown Product";
            const price = parseFloat(
                prod.price ?? prod.Price ?? prod['Retail Price'] ?? prod['Unit Price'] ?? 0
            ) || 0;
            const pctCode = prod.pctCode || prod.PCT_Code || prod.pct_code || prod['PCT Code'] || prod.PCT || "";
            const taxRate = parseFloat(prod.taxRate ?? prod['Tax Rate'] ?? prod.Tax ?? 17.0) || 17.0;

            let finalStock = (
                prod.balance_qty ?? prod['Balance Qty'] ?? prod.quantity ?? prod.Quantity ?? prod.stock ?? 0
            );
            finalStock = parseInt(finalStock) || 0;
            if (finalStock <= 1) finalStock = 100;

            try {
                await runAsync(
                    "INSERT INTO products (name, price, stock, pctCode, taxRate) VALUES (?, ?, ?, ?, ?)",
                    [name, price, finalStock, pctCode, taxRate]
                );
                successCount++;
            } catch (err) {
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        await runAsync("COMMIT");
        res.json({ success: true, count: successCount, errors });

    } catch (err) {
        await runAsync("ROLLBACK");
        return res.status(500).json({ error: "Transaction failed", details: err.message });
    }
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    req.db.run("DELETE FROM products WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const { name, price, stock, pctCode, taxRate } = req.body;
    req.db.run("UPDATE products SET name = ?, price = ?, stock = ?, pctCode = ?, taxRate = ? WHERE id = ?", 
        [name, price, stock, pctCode, taxRate, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});

app.post('/api/products/:id/stock', authMiddleware, (req, res) => {
    const { quantity } = req.body;
    
    // Ensure quantity is a valid number
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: "Invalid quantity. Must be a positive number." });
    }

    // Update stock
    req.db.run("UPDATE products SET stock = stock + ? WHERE id = ?", 
        [qty, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Check if any row was updated
        if (this.changes === 0) {
            return res.status(404).json({ error: "Product not found" });
        }
        
        res.json({ success: true, message: "Stock updated successfully", added: qty });
    });
});

app.get('/api/invoices', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM invoices WHERE IFNULL(deleted, 0) = 0 ORDER BY id DESC LIMIT 50", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/pos/transactions', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Forbidden. Only Owner/Admin can access POS transactions." });
    }

    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;
    const includeDeleted = req.query.includeDeleted === '1' || req.query.includeDeleted === 'true';
    const q = (req.query.q || '').toString().trim().toLowerCase();

    const where = [];
    const params = [];

    if (!includeDeleted) {
        where.push("IFNULL(deleted, 0) = 0");
    }
    if (q) {
        where.push("(LOWER(IFNULL(invoiceNumber, '')) LIKE ? OR LOWER(IFNULL(buyerName, '')) LIKE ? OR LOWER(IFNULL(buyerPhone, '')) LIKE ?)");
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    req.db.all(
        `SELECT id, invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, status, deleted, returnedAt, updatedAt FROM invoices ${whereSql} ORDER BY id DESC LIMIT ?`,
        [...params, limit],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

app.get('/api/pos/transactions/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Forbidden. Only Owner/Admin can access POS transactions." });
    }

    const id = req.params.id;
    req.db.get("SELECT * FROM invoices WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Transaction not found" });

        let items = [];
        try {
            items = row.items ? (typeof row.items === 'string' ? JSON.parse(row.items) : row.items) : [];
        } catch {
            items = [];
        }

        res.json({ ...row, items });
    });
});

app.put('/api/pos/transactions/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Forbidden. Only Owner/Admin can edit POS transactions." });
    }

    const id = req.params.id;
    const buyerName = (req.body.buyerName || '').toString();
    const buyerCNIC = (req.body.buyerCNIC || '').toString();
    const buyerNTN = (req.body.buyerNTN || '').toString();
    const buyerPhone = (req.body.buyerPhone || '').toString();
    const updatedAt = new Date().toISOString();

    req.db.run(
        "UPDATE invoices SET buyerName = ?, buyerCNIC = ?, buyerNTN = ?, buyerPhone = ?, updatedAt = ? WHERE id = ? AND IFNULL(deleted, 0) = 0",
        [buyerName, buyerCNIC, buyerNTN, buyerPhone, updatedAt, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Transaction not found" });
            res.json({ success: true });
        }
    );
});

app.post('/api/pos/transactions/:id/return', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Forbidden. Only Owner/Admin can return POS transactions." });
    }

    const id = req.params.id;
    const reason = (req.body.reason || '').toString();

    req.db.get("SELECT id, status, deleted, items FROM invoices WHERE id = ?", [id], async (err, invoice) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!invoice) return res.status(404).json({ error: "Transaction not found" });
        if (invoice.deleted) return res.status(400).json({ error: "Transaction is deleted" });
        if ((invoice.status || '').toLowerCase() === 'returned') return res.status(400).json({ error: "Transaction already returned" });

        let items = [];
        try {
            items = invoice.items ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items) : [];
        } catch {
            items = [];
        }

        try {
            for (const item of items) {
                const productId = item?.id ?? item?.product_id ?? item?.productId ?? item?.productID;
                const qty = Number(item?.quantity ?? 1);
                if (!productId || !Number.isFinite(qty) || qty <= 0) continue;
                await new Promise((resolve, reject) => {
                    req.db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [qty, productId], (e) => e ? reject(e) : resolve());
                });
            }

            const now = new Date().toISOString();
            req.db.run(
                "UPDATE invoices SET status = 'returned', returnedAt = ?, returnReason = ?, updatedAt = ? WHERE id = ?",
                [now, reason, now, id],
                function(e2) {
                    if (e2) return res.status(500).json({ error: e2.message });
                    res.json({ success: true });
                }
            );
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
});

app.delete('/api/pos/transactions/:id', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: "Forbidden. Only Owner/Admin can delete POS transactions." });
    }

    const id = req.params.id;

    req.db.get("SELECT id, status, deleted, items FROM invoices WHERE id = ?", [id], async (err, invoice) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!invoice) return res.status(404).json({ error: "Transaction not found" });
        if (invoice.deleted) return res.status(400).json({ error: "Transaction already deleted" });

        const status = (invoice.status || '').toLowerCase();
        let items = [];
        try {
            items = invoice.items ? (typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items) : [];
        } catch {
            items = [];
        }

        try {
            if (status !== 'returned') {
                for (const item of items) {
                    const productId = item?.id ?? item?.product_id ?? item?.productId ?? item?.productID;
                    const qty = Number(item?.quantity ?? 1);
                    if (!productId || !Number.isFinite(qty) || qty <= 0) continue;
                    await new Promise((resolve, reject) => {
                        req.db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [qty, productId], (e) => e ? reject(e) : resolve());
                    });
                }
            }

            const now = new Date().toISOString();
            req.db.run(
                "UPDATE invoices SET deleted = 1, status = 'deleted', updatedAt = ? WHERE id = ?",
                [now, id],
                function(e2) {
                    if (e2) return res.status(500).json({ error: e2.message });
                    res.json({ success: true });
                }
            );
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
});

app.post('/api/invoices', authMiddleware, (req, res) => {
    let { totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, items, customerId, redeemedPoints } = req.body; 
    redeemedPoints = parseInt(redeemedPoints) || 0;
    
    if (!totalAmount && items && Array.isArray(items)) {
        totalAmount = items.reduce((sum, item) => {
             const price = parseFloat(item.price) || 0;
             const qty = parseFloat(item.quantity) || 1;
             const taxRate = parseFloat(item.taxRate) || 0;
             const itemTotal = price * qty;
             const tax = itemTotal * (taxRate / 100);
             return sum + itemTotal + tax;
        }, 0);
    }

    const proceedWithInvoice = () => {
        req.db.all("SELECT * FROM settings WHERE `key` IN ('pos_id', 'fbr_pos_id', 'fbr_auth_token', 'fbr_api_url')", async (err, rows) => {
            const settings = {};
            if (rows) {
                rows.forEach(r => settings[r.key] = r.value);
            }

            const posId = settings.fbr_pos_id || settings.pos_id;
            let fbrResponse = null;

            if (posId) {
                try {
                    fbrResponse = await sendToFBR({ 
                        totalAmount, 
                        buyerNTN, 
                        buyerCNIC,
                        buyerName,
                        buyerPhone,
                        items: items.map(item => ({
                            ...item,
                            taxRate: item.taxRate || 0, 
                            quantity: item.quantity || 1
                        }))
                    }, settings);
                } catch (fbrError) {
                    console.error("FBR Error:", fbrError);
                    fbrResponse = { error: fbrError.message, code: "FBR_FAILED" };
                }
            }

            const invoiceNumber = `INV-${Date.now()}`;
            const date = new Date().toISOString();
            const fbrJson = fbrResponse ? JSON.stringify(fbrResponse) : null;
            const pointsAmount = redeemedPoints > 0 ? (redeemedPoints / 100) : 0;

            req.db.run(`INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse, items, pointsRedeemed, pointsAmount) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrJson, JSON.stringify(items), redeemedPoints, pointsAmount],
                    function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        
                        // Use req.db.run for stock updates to ensure table prefixing works
                        const updateStock = async () => {
                            for (const item of items) {
                                await new Promise((resolve, reject) => {
                                    req.db.run("UPDATE products SET stock = stock - ? WHERE id = ?", 
                                        [item.quantity || 1, item.id], 
                                        (err) => err ? reject(err) : resolve()
                                    );
                                });
                            }
                        };

                        updateStock().catch(err => console.error("Stock update failed:", err));

                        // Update Loyalty Points (Deduct Redeemed + Add Earned)
                        if (customerId) {
                            const earnedPoints = Math.floor(totalAmount / 100); // 1 point per 100 rupees
                            const netPointsChange = earnedPoints - redeemedPoints;
                            
                            if (netPointsChange !== 0) {
                                req.db.run("UPDATE customers SET loyaltyPoints = loyaltyPoints + ? WHERE id = ?", [netPointsChange, customerId], (err) => {
                                     if (err) console.error("Failed to update loyalty points:", err);
                                });
                            }
                        }

                        res.json({ 
                            success: true, 
                            invoiceNumber, 
                            fbrResponse,
                            warning: fbrResponse?.code === "FBR_FAILED" ? "FBR integration failed" : undefined
                        });
                    }
            );
        });
    };

    if (customerId && redeemedPoints > 0) {
        req.db.get("SELECT loyaltyPoints FROM customers WHERE id = ?", [customerId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(400).json({ error: "Customer not found" });
            if (row.loyaltyPoints < redeemedPoints) {
                return res.status(400).json({ error: "Insufficient loyalty points" });
            }
            proceedWithInvoice();
        });
    } else {
        proceedWithInvoice();
    }
});

app.post('/api/invoices/import', authMiddleware, async (req, res) => {
    const { invoices } = req.body;
    if (!invoices || !Array.isArray(invoices)) {
        return res.status(400).json({ error: "Invalid data. Expected 'invoices' array." });
    }

    let successCount = 0;
    let errors = [];

    const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
        req.db.run(sql, params, (err) => err ? reject(err) : resolve());
    });

    try {
        await runAsync("START TRANSACTION");

        for (let i = 0; i < invoices.length; i++) {
            const inv = invoices[i] || {};
            if (!inv.invoiceNumber && !inv.invoice_no && !inv.inv) {
                errors.push(`Row ${i + 1}: Missing Invoice Number`);
                continue;
            }

            const invoiceNumber = inv.invoiceNumber || inv.invoice_no || inv.inv;
            const date = inv.date || new Date().toISOString();
            const buyerName = inv.buyerName || inv.customer || inv.name || 'Walk-in';
            const buyerCNIC = inv.buyerCNIC || inv.cnic || '';
            const buyerNTN = inv.buyerNTN || inv.ntn || '';

            const itemsJson = inv.items ? JSON.stringify(inv.items) : '[]';
            const totalAmount = parseFloat(inv.totalAmount ?? inv.total ?? inv.amount ?? 0) || 0;

            try {
                await runAsync(
                    `INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, items) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, itemsJson]
                );
                successCount++;
            } catch (err) {
                if (err.message.includes('Duplicate entry') || err.code === 'ER_DUP_ENTRY') {
                    errors.push(`Invoice ${invoiceNumber} already exists`);
                } else {
                    errors.push(`Invoice ${invoiceNumber}: ${err.message}`);
                }
            }
        }

        await runAsync("COMMIT");
        res.json({ success: true, count: successCount, errors });

    } catch (err) {
        await runAsync("ROLLBACK");
        return res.status(500).json({ error: "Transaction failed", details: err.message });
    }
});

app.get('/api/accounting/receivables', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access accounting." });
    }

    const sql = `
        SELECT 
            t.id,
            t.refNumber,
            t.date,
            t.dueDate,
            t.partyName,
            t.description,
            t.amount,
            t.fbrResponse,
            IFNULL(p.paidTotal, 0) AS paidTotal,
            (t.amount - IFNULL(p.paidTotal, 0)) AS outstanding
        FROM transactions t
        LEFT JOIN (
            SELECT parentId, SUM(amount) AS paidTotal
            FROM transactions
            WHERE type = 'receipt'
            GROUP BY parentId
        ) p ON p.parentId = t.id
        WHERE t.direction = 'receivable' AND t.type = 'invoice'
        ORDER BY t.date DESC
    `;

    req.db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const now = new Date();
        const mapped = rows.map(row => {
            const baseDate = row.dueDate ? new Date(row.dueDate) : new Date(row.date);
            const diffMs = now - baseDate;
            const ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            let status = 'open';
            if (row.outstanding <= 0.01) {
                status = 'closed';
            } else if (row.paidTotal > 0) {
                status = 'partial';
            }
            return {
                ...row,
                ageDays,
                status
            };
        });

        res.json(mapped);
    });
});

app.post('/api/accounting/receivables', authMiddleware, async (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access accounting." });
    }

    const { partnerId, partyName, refNumber, date, dueDate, amount, description } = req.body;

    if ((!partyName && !partnerId) || !amount) {
        return res.status(400).json({ error: "Either partnerId or partyName and amount are required" });
    }

    const now = new Date();
    const invoiceDate = date ? new Date(date) : now;
    const due = dueDate ? new Date(dueDate) : null;
    const ref = refNumber && refNumber.trim() !== '' ? refNumber : `AR-${Date.now()}`;
    const amt = parseFloat(amount);

    if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: "amount must be a positive number" });
    }

    // Fetch FBR Settings
    const settings = await new Promise((resolve) => {
        req.db.all("SELECT * FROM settings WHERE `key` IN ('pos_id', 'fbr_pos_id', 'fbr_auth_token', 'fbr_api_url')", (err, rows) => {
            const s = {};
            if (rows) rows.forEach(r => s[r.key] = r.value);
            resolve(s);
        });
    });

    let partnerDetails = {};
    let resolvedPartyName = partyName;
    let resolvedPartnerId = null;

    if (partnerId) {
        try {
            const partner = await new Promise((resolve, reject) => {
                req.db.get("SELECT * FROM partners WHERE id = ?", [partnerId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!partner) return res.status(400).json({ error: "Partner not found" });
            partnerDetails = partner;
            resolvedPartyName = partner.name;
            resolvedPartnerId = partner.id;
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    let fbrResponse = null;
    const posId = settings.fbr_pos_id || settings.pos_id;

    if (posId) {
        try {
            // Construct FBR Payload for Receivable
            const fbrPayload = {
                totalAmount: amt,
                buyerName: resolvedPartyName,
                buyerNTN: partnerDetails.taxNumber || "",
                buyerPhone: partnerDetails.phone || "",
                buyerCNIC: "99999-9999999-9", // Default consumer
                items: [{
                    name: description || "Services/Goods",
                    quantity: 1,
                    price: amt,
                    taxRate: 0, // Default 0 as tax info is missing in simple accounting
                    pctCode: "00000000"
                }]
            };
            
            fbrResponse = await sendToFBR(fbrPayload, settings);
        } catch (err) {
            console.error("FBR Error for Receivable:", err);
            fbrResponse = { error: err.message, code: "FBR_FAILED" };
        }
    }

    const fbrJson = fbrResponse ? JSON.stringify(fbrResponse) : null;

    req.db.run(
        "INSERT INTO transactions (type, direction, refNumber, date, dueDate, partyName, description, amount, status, source, partnerId, fbrResponse) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            'invoice',
            'receivable',
            ref,
            invoiceDate.toISOString(),
            due ? due.toISOString() : null,
            resolvedPartyName,
            description || '',
            amt,
            'open',
            'manual',
            resolvedPartnerId || null,
            fbrJson
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, refNumber: ref, fbrResponse });
        }
    );
});

app.post('/api/accounting/receivables/:id/receipt', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access accounting." });
    }

    const id = req.params.id;
    const { amount, date, description } = req.body;

    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: "amount must be a positive number" });
    }

    req.db.get("SELECT * FROM transactions WHERE id = ? AND direction = 'receivable' AND type = 'invoice'", [id], (err, invoice) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!invoice) return res.status(404).json({ error: "Invoice not found" });

        req.db.get(
            "SELECT SUM(amount) as totalPaid FROM transactions WHERE parentId = ? AND type = 'receipt'",
            [id],
            (err2, row) => {
                if (err2) return res.status(500).json({ error: err2.message });

                const totalPaid = row && row.totalPaid ? parseFloat(row.totalPaid) : 0;
                const outstanding = parseFloat(invoice.amount) - totalPaid;

                if (amt - outstanding > 0.01) {
                    return res.status(400).json({ error: "Payment amount exceeds outstanding balance" });
                }

                const payDate = date ? new Date(date) : new Date();

                req.db.run(
                    "INSERT INTO transactions (type, direction, refNumber, date, partyName, description, amount, status, parentId, source, partnerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        'receipt',
                        'receivable',
                        invoice.refNumber,
                        payDate.toISOString(),
                        invoice.partyName,
                        description || '',
                        amt,
                        'closed',
                        id,
                        'manual',
                        invoice.partnerId || null
                    ],
                    function(err3) {
                        if (err3) return res.status(500).json({ error: err3.message });
                        res.json({ id: this.lastID });
                    }
                );
            }
        );
    });
});

app.get('/api/accounting/payables', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access accounting." });
    }

    const sql = `
        SELECT 
            t.id,
            t.refNumber,
            t.date,
            t.dueDate,
            t.partyName,
            t.description,
            t.amount,
            t.fbrResponse,
            IFNULL(p.paidTotal, 0) AS paidTotal,
            (t.amount - IFNULL(p.paidTotal, 0)) AS outstanding
        FROM transactions t
        LEFT JOIN (
            SELECT parentId, SUM(amount) AS paidTotal
            FROM transactions
            WHERE type = 'payment'
            GROUP BY parentId
        ) p ON p.parentId = t.id
        WHERE t.direction = 'payable' AND t.type = 'bill'
        ORDER BY t.date DESC
    `;

    req.db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const now = new Date();
        const mapped = rows.map(row => {
            const baseDate = row.dueDate ? new Date(row.dueDate) : new Date(row.date);
            const diffMs = now - baseDate;
            const ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            let status = 'open';
            if (row.outstanding <= 0.01) {
                status = 'closed';
            } else if (row.paidTotal > 0) {
                status = 'partial';
            }
            return {
                ...row,
                ageDays,
                status
            };
        });

        res.json(mapped);
    });
});

app.post('/api/accounting/payables', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access accounting." });
    }

    const { partnerId, partyName, refNumber, date, dueDate, amount, description, fbrInvoiceNumber } = req.body;

    if ((!partyName && !partnerId) || !amount) {
        return res.status(400).json({ error: "Either partnerId or partyName and amount are required" });
    }

    const now = new Date();
    const billDate = date ? new Date(date) : now;
    const due = dueDate ? new Date(dueDate) : null;
    const ref = refNumber && refNumber.trim() !== '' ? refNumber : `AP-${Date.now()}`;
    const amt = parseFloat(amount);
    
    // Format FBR response if provided
    const fbrJson = fbrInvoiceNumber ? JSON.stringify({ InvoiceNumber: fbrInvoiceNumber }) : null;

    if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: "amount must be a positive number" });
    }

    const insertBill = (resolvedPartyName, resolvedPartnerId) => {
        req.db.run(
            "INSERT INTO transactions (type, direction, refNumber, date, dueDate, partyName, description, amount, status, source, partnerId, fbrResponse) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                'bill',
                'payable',
                ref,
                billDate.toISOString(),
                due ? due.toISOString() : null,
                resolvedPartyName,
                description || '',
                amt,
                'open',
                'manual',
                resolvedPartnerId || null,
                fbrJson
            ],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, refNumber: ref });
            }
        );
    };

    if (partnerId) {
        req.db.get("SELECT id, name FROM partners WHERE id = ?", [partnerId], (err, partner) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!partner) return res.status(400).json({ error: "Partner not found" });
            insertBill(partner.name, partner.id);
        });
    } else {
        insertBill(partyName, null);
    }
});

app.post('/api/accounting/payables/:id/payment', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access accounting." });
    }

    const id = req.params.id;
    const { amount, date, description } = req.body;

    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: "amount must be a positive number" });
    }

    req.db.get("SELECT * FROM transactions WHERE id = ? AND direction = 'payable' AND type = 'bill'", [id], (err, bill) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!bill) return res.status(404).json({ error: "Bill not found" });

        req.db.get(
            "SELECT SUM(amount) as totalPaid FROM transactions WHERE parentId = ? AND type = 'payment'",
            [id],
            (err2, row) => {
                if (err2) return res.status(500).json({ error: err2.message });

                const totalPaid = row && row.totalPaid ? parseFloat(row.totalPaid) : 0;
                const outstanding = parseFloat(bill.amount) - totalPaid;

                if (amt - outstanding > 0.01) {
                    return res.status(400).json({ error: "Payment amount exceeds outstanding balance" });
                }

                const payDate = date ? new Date(date) : new Date();

                req.db.run(
                    "INSERT INTO transactions (type, direction, refNumber, date, partyName, description, amount, status, parentId, source, partnerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        'payment',
                        'payable',
                        bill.refNumber,
                        payDate.toISOString(),
                        bill.partyName,
                        description || '',
                        amt,
                        'closed',
                        id,
                        'manual',
                        bill.partnerId || null
                    ],
                    function(err3) {
                        if (err3) return res.status(500).json({ error: err3.message });
                        res.json({ id: this.lastID });
                    }
                );
            }
        );
    });
});

app.get('/api/partners', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access partners." });
    }

    const { type } = req.query;
    const params = [];
    let where = '';

    if (type === 'customer' || type === 'vendor' || type === 'both') {
        where = "WHERE type = ?";
        params.push(type);
    }

    const sql = `
        SELECT 
            id,
            name,
            type,
            email,
            phone,
            taxNumber,
            address,
            createdAt
        FROM partners
        ${where}
        ORDER BY name ASC
    `;

    req.db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/partners', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can modify partners." });
    }

    const { name, type, email, phone, taxNumber, address } = req.body;

    if (!name || !type) {
        return res.status(400).json({ error: "name and type are required" });
    }

    if (!['customer', 'vendor', 'both'].includes(type)) {
        return res.status(400).json({ error: "type must be customer, vendor, or both" });
    }

    req.db.run(
        "INSERT INTO partners (name, type, email, phone, taxNumber, address) VALUES (?, ?, ?, ?, ?, ?)",
        [name, type, email || null, phone || null, taxNumber || null, address || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.put('/api/partners/:id', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can modify partners." });
    }

    const id = req.params.id;
    const { name, type, email, phone, taxNumber, address } = req.body;

    if (type && !['customer', 'vendor', 'both'].includes(type)) {
        return res.status(400).json({ error: "type must be customer, vendor, or both" });
    }

    req.db.get("SELECT * FROM partners WHERE id = ?", [id], (err, partner) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!partner) return res.status(404).json({ error: "Partner not found" });

        const updatedName = name !== undefined ? name : partner.name;
        const updatedType = type !== undefined ? type : partner.type;
        const updatedEmail = email !== undefined ? email : partner.email;
        const updatedPhone = phone !== undefined ? phone : partner.phone;
        const updatedTaxNumber = taxNumber !== undefined ? taxNumber : partner.taxNumber;
        const updatedAddress = address !== undefined ? address : partner.address;

        req.db.run(
            "UPDATE partners SET name = ?, type = ?, email = ?, phone = ?, taxNumber = ?, address = ? WHERE id = ?",
            [updatedName, updatedType, updatedEmail, updatedPhone, updatedTaxNumber, updatedAddress, id],
            function(err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ changes: this.changes });
            }
        );
    });
});

app.get('/api/reports/receivables', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access reports." });
    }

    req.db.all(
        "SELECT * FROM transactions WHERE direction = 'receivable' AND type = 'invoice'",
        (err, invoices) => {
            if (err) return res.status(500).json({ error: err.message });

            req.db.all(
                "SELECT parentId, SUM(amount) as totalPaid FROM transactions WHERE direction = 'receivable' AND type = 'receipt' GROUP BY parentId",
                (err2, payments) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    const paymentMap = {};
                    (payments || []).forEach(p => {
                        paymentMap[p.parentId] = p.totalPaid || 0;
                    });

                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const aging = {
                        current: 0,
                        days_1_30: 0,
                        days_31_60: 0,
                        days_61_90: 0,
                        days_90_plus: 0
                    };

                    let totalReceivable = 0;
                    let totalOutstanding = 0;
                    let totalOverdue = 0;

                    const detailed = (invoices || []).map(inv => {
                        const paid = parseFloat(paymentMap[inv.id] || 0);
                        const amount = parseFloat(inv.amount || 0);
                        const outstanding = amount - paid;

                        const baseDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
                        
                        let ageDays = 0;
                        if (!isNaN(baseDate.getTime())) {
                            const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                            const diffMs = today - baseDay;
                            ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        }

                        totalReceivable += amount;
                        if (outstanding > 0) {
                            totalOutstanding += outstanding;
                            if (ageDays > 0) {
                                totalOverdue += outstanding;
                            }

                            if (ageDays <= 0) aging.current += outstanding;
                            else if (ageDays <= 30) aging.days_1_30 += outstanding;
                            else if (ageDays <= 60) aging.days_31_60 += outstanding;
                            else if (ageDays <= 90) aging.days_61_90 += outstanding;
                            else aging.days_90_plus += outstanding;
                        }

                        let status = 'open';
                        if (outstanding <= 0.01) {
                            status = 'closed';
                        } else if (paid > 0) {
                            status = 'partial';
                        }

                        return {
                            id: inv.id,
                            refNumber: inv.refNumber,
                            date: inv.date,
                            dueDate: inv.dueDate,
                            partyName: inv.partyName,
                            description: inv.description,
                            amount,
                            paid,
                            outstanding,
                            ageDays,
                            status
                        };
                    });

                    res.json({
                        totalReceivable,
                        totalOutstanding,
                        totalOverdue,
                        aging,
                        invoices: detailed
                    });
                }
            );
        }
    );
});

app.get('/api/reports/payables', authMiddleware, (req, res) => {
    if (!req.user.accountingEnabled) {
        return res.status(403).json({ error: "Accounting features are not available in your plan." });
    }
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access reports." });
    }

    req.db.all(
        "SELECT * FROM transactions WHERE direction = 'payable' AND type = 'bill'",
        (err, bills) => {
            if (err) return res.status(500).json({ error: err.message });

            req.db.all(
                "SELECT parentId, SUM(amount) as totalPaid FROM transactions WHERE direction = 'payable' AND type = 'payment' GROUP BY parentId",
                (err2, payments) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    const paymentMap = {};
                    (payments || []).forEach(p => {
                        paymentMap[p.parentId] = p.totalPaid || 0;
                    });

                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const aging = {
                        current: 0,
                        days_1_30: 0,
                        days_31_60: 0,
                        days_61_90: 0,
                        days_90_plus: 0
                    };

                    let totalPayable = 0;
                    let totalOutstanding = 0;
                    let totalOverdue = 0;

                    const detailed = (bills || []).map(bill => {
                        const paid = parseFloat(paymentMap[bill.id] || 0);
                        const amount = parseFloat(bill.amount || 0);
                        const outstanding = amount - paid;

                        const baseDate = bill.dueDate ? new Date(bill.dueDate) : new Date(bill.date);
                        
                        let ageDays = 0;
                        if (!isNaN(baseDate.getTime())) {
                            const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                            const diffMs = today - baseDay;
                            ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        }

                        totalPayable += amount;
                        if (outstanding > 0) {
                            totalOutstanding += outstanding;
                            if (ageDays > 0) {
                                totalOverdue += outstanding;
                            }

                            if (ageDays <= 0) aging.current += outstanding;
                            else if (ageDays <= 30) aging.days_1_30 += outstanding;
                            else if (ageDays <= 60) aging.days_31_60 += outstanding;
                            else if (ageDays <= 90) aging.days_61_90 += outstanding;
                            else aging.days_90_plus += outstanding;
                        }

                        let status = 'open';
                        if (outstanding <= 0.01) {
                            status = 'closed';
                        } else if (paid > 0) {
                            status = 'partial';
                        }

                        return {
                            id: bill.id,
                            refNumber: bill.refNumber,
                            date: bill.date,
                            dueDate: bill.dueDate,
                            partyName: bill.partyName,
                            description: bill.description,
                            amount,
                            paid,
                            outstanding,
                            ageDays,
                            status
                        };
                    });

                    res.json({
                        totalPayable,
                        totalOutstanding,
                        totalOverdue,
                        aging,
                        bills: detailed
                    });
                }
            );
        }
    );
});

app.get('/api/reports/payments', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'accountant') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Accountant can access reports." });
    }

    const { type } = req.query;
    let where = "type IN ('receipt', 'payment')";
    const params = [];

    if (type === 'receipts') {
        where = "type = 'receipt'";
    } else if (type === 'payments') {
        where = "type = 'payment'";
    }

    const sql = `
        SELECT 
            id,
            type,
            direction,
            refNumber,
            date,
            partyName,
            description,
            amount
        FROM transactions
        WHERE ${where}
        ORDER BY date DESC
        LIMIT 500
    `;

    req.db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/reports/transactions', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner' && req.user.role !== 'superadmin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden. Only Owner and Admin can access reports." });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start Date and End Date are required" });
    }

    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    req.db.get(
        "SELECT SUM(totalAmount) as total, COUNT(*) as count FROM invoices WHERE IFNULL(deleted, 0) = 0 AND LOWER(IFNULL(status, 'completed')) NOT IN ('returned', 'deleted') AND date >= ? AND date <= ?",
        [startDateTime.toISOString(), endDateTime.toISOString()],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                total: row ? row.total || 0 : 0,
                count: row ? row.count || 0 : 0
            });
        }
    );
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
    const stats = { revenue: 0, orders: 0, lowStockCount: 0 };
    
    req.db.get("SELECT SUM(totalAmount) as revenue, COUNT(*) as orders FROM invoices WHERE IFNULL(deleted, 0) = 0 AND LOWER(IFNULL(status, 'completed')) NOT IN ('returned', 'deleted')", (err, row) => {
        if (row) {
            stats.revenue = row.revenue || 0;
            stats.orders = row.orders || 0;
        }

        req.db.get("SELECT COUNT(*) as low FROM products WHERE stock < 5", (err, row) => {
            if (row) stats.lowStockCount = row.low;

            req.db.all("SELECT * FROM products WHERE stock < 5", (err, lowStockItems) => {
                req.db.all("SELECT * FROM invoices WHERE IFNULL(deleted, 0) = 0 ORDER BY id DESC LIMIT 5", (err, recentTransactions) => {
                    res.json({ stats, lowStockItems, recentTransactions });
                });
            });
        });
    });
});

app.get('/api/ai-insights', authMiddleware, async (req, res) => {
    if (!req.user.aiEnabled) {
        return res.status(403).json({ error: "AI Insights are available in the Pro plan." });
    }
    try {
        const insights = await analyticsService.getInsights(req.db);
        res.json(insights);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "AI Insights Failed" });
    }
});

app.get('/api/settings', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM settings", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        
        // Also fetch website_enabled status from Master DB
        masterDB.get("SELECT website_enabled FROM tenants WHERE id = ?", [req.user.tenantId], (err, tenant) => {
            if (!err && tenant) {
                settings.website_enabled = !!tenant.website_enabled;
            }
            res.json(settings);
        });
    });
});

app.get('/api/users', authMiddleware, (req, res) => {
    req.db.all("SELECT id, name, username, role FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', authMiddleware, (req, res) => {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: "Missing required fields" });

    masterDB.get("SELECT username FROM user_lookup WHERE username = ?", [username], (err, row) => {
        if (row) return res.status(400).json({ error: "Username is already taken globally. Please choose another." });

        const hash = bcrypt.hashSync(password, 10);

        req.db.run("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
            [name, username, hash, role || 'cashier'],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: "Username already exists in this store" });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                const userId = this.lastID;

                masterDB.run("INSERT INTO user_lookup (username, tenant_id) VALUES (?, ?)", 
                    [username, req.user.tenantId], 
                    (err) => {
                        if (err) {
                            console.error("Failed to add to user_lookup", err);
                            req.db.run("DELETE FROM users WHERE id = ?", [userId]);
                            return res.status(500).json({ error: "Failed to register user globally" });
                        }
                        res.json({ id: userId, message: "User created successfully" });
                    }
                );
            }
        );
    });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { name, username, password, role } = req.body;

    req.db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: "User not found" });

        const newName = name || user.name;
        const newRole = role || user.role;
        let newPasswordHash = user.password;
        
        if (password && password.trim() !== "") {
            newPasswordHash = bcrypt.hashSync(password, 10);
        }

        req.db.run("UPDATE users SET name = ?, password = ?, role = ? WHERE id = ?",
            [newName, newPasswordHash, newRole, id],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: "User updated successfully" });
            }
        );
    });
});

// Endpoint for users (Owner or Staff) to update their own password
app.post('/api/profile/password', authMiddleware, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (req.user.role === 'owner') {
        // Update Tenant in Master DB
        masterDB.get("SELECT * FROM tenants WHERE id = ?", [req.user.tenantId], (err, tenant) => {
            if (err || !tenant) return res.status(404).json({ error: "Tenant not found" });

            // Optional: Verify current password if needed. 
            // For now, let's assume if they are logged in (have token), they can change it.
            // But checking current password is best practice.
            if (currentPassword) {
                 if (!bcrypt.compareSync(currentPassword, tenant.password)) {
                     return res.status(400).json({ error: "Current password is incorrect" });
                 }
            }

            const hash = bcrypt.hashSync(newPassword, 10);
            masterDB.run("UPDATE tenants SET password = ? WHERE id = ?", [hash, req.user.tenantId], (err) => {
                if (err) return res.status(500).json({ error: "Failed to update password" });
                res.json({ success: true, message: "Password updated successfully" });
            });
        });
    } else {
        // Update User in Tenant DB
        req.db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
            if (err || !user) return res.status(404).json({ error: "User not found" });

            if (currentPassword) {
                 if (!bcrypt.compareSync(currentPassword, user.password)) {
                     return res.status(400).json({ error: "Current password is incorrect" });
                 }
            }

            const hash = bcrypt.hashSync(newPassword, 10);
            req.db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.user.id], (err) => {
                if (err) return res.status(500).json({ error: "Failed to update password" });
                res.json({ success: true, message: "Password updated successfully" });
            });
        });
    }
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    
    req.db.get("SELECT username FROM users WHERE id = ?", [id], (err, user) => {
        if (!user) return res.status(404).json({ error: "User not found" });

        req.db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            masterDB.run("DELETE FROM user_lookup WHERE username = ?", [user.username]);
            
            res.json({ success: true, message: "User deleted" });
        });
    });
});

// --- Custom Domain Settings (Owner Only) ---

app.get('/api/settings/domain', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner') return res.status(403).json({ error: "Forbidden" });

    masterDB.get("SELECT custom_domain, slug FROM tenants WHERE id = ?", [req.user.tenantId], (err, row) => {
        if (err) return res.status(500).json({ error: "Server Error" });
        res.json({ domain: row ? row.custom_domain : null, slug: row ? row.slug : null });
    });
});

app.put('/api/settings/domain', authMiddleware, (req, res) => {
    if (req.user.role !== 'owner') return res.status(403).json({ error: "Forbidden" });

    let { domain, slug } = req.body;
    let sql = "UPDATE tenants SET ";
    let params = [];
    let updates = [];

    // Domain Validation
    if (domain !== undefined) {
        if (domain) {
            domain = domain.trim().toLowerCase();
            domain = domain.replace(/^https?:\/\//, '');
            if (domain.endsWith('/')) domain = domain.slice(0, -1);
            
            if (domain === 'localhost' || domain.startsWith('127.') || domain.startsWith('192.168.')) {
                return res.status(400).json({ error: "Cannot use localhost or private IP addresses" });
            }
            updates.push("custom_domain = ?");
            params.push(domain);
        } else {
            updates.push("custom_domain = ?");
            params.push(null);
        }
    }

    // Slug Validation
    if (slug !== undefined) {
        if (slug) {
            slug = slug.trim().toLowerCase();
            if (!/^[a-z0-9-]+$/.test(slug)) {
                return res.status(400).json({ error: "Slug can only contain lowercase letters, numbers, and hyphens" });
            }
            if (slug.length < 3) {
                return res.status(400).json({ error: "Slug must be at least 3 characters long" });
            }
            // Check reserved words
            const reserved = ['api', 'static', 'assets', 'login', 'register', 'dashboard', 'settings', 'admin', 'superadmin'];
            if (reserved.includes(slug)) {
                return res.status(400).json({ error: "This slug is reserved and cannot be used" });
            }

            updates.push("slug = ?");
            params.push(slug);
        }
    }

    if (updates.length === 0) {
        return res.json({ success: true, message: "No changes made" });
    }

    sql += updates.join(", ") + " WHERE id = ?";
    params.push(req.user.tenantId);

    masterDB.run(sql, params, function(err) {
        if (err) {
            if (err.message && err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: "Domain or Slug is already in use by another store." });
            }
            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                 return res.status(400).json({ error: "Domain or Slug is already in use by another store." });
            }
            console.error("Domain Update Error:", err);
            return res.status(500).json({ error: "Server Error" });
        }
        res.json({ success: true, domain, slug, message: "Settings updated successfully" });
    });
});

app.post('/api/settings', authMiddleware, async (req, res) => {
    if (!(req.user.role === 'owner' || req.user.role === 'admin' || req.user.role === 'accountant')) {
        return res.status(403).json({ error: "Only Owner/Accountant can update settings." });
    }

    const settings = req.body;

    // IMPORTANT: Use the tenant DB wrapper so table names are prefixed (tenant_{id}_settings)
    const runAsync = (sql, params) => new Promise((resolve, reject) => {
        req.db.run(sql, params, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
    
    try {
        const keys = Object.keys(settings);
        for (const key of keys) {
            const value = typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : String(settings[key]);
            // Robust UPSERT: check existence, then UPDATE or INSERT
            const existing = await new Promise((resolve, reject) => {
                req.db.get("SELECT `key` FROM settings WHERE `key` = ?", [key], (err, row) => {
                    if (err) return reject(err);
                    resolve(row);
                });
            });
            if (existing) {
                await runAsync("UPDATE settings SET value = ? WHERE `key` = ?", [value, key]);
            } else {
                await runAsync("INSERT INTO settings (`key`, value) VALUES (?, ?)", [key, value]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Error saving settings:", err);
        return res.status(500).json({ error: "Failed to save settings", details: err?.sqlMessage || err?.message || String(err) });
    }
});

// Voice Command Endpoint
app.post('/api/voice-command', authMiddleware, voiceService.upload.single('audio'), async (req, res) => {
    if (!req.user.aiEnabled) {
        return res.status(403).json({ error: "Voice commands are available in the Pro plan." });
    }
    try {
        let text = req.body.text;

        // Fetch API Key from Settings
        const apiKey = await new Promise((resolve) => {
            req.db.get("SELECT value FROM settings WHERE `key` = 'openai_api_key'", (err, row) => {
                resolve(row ? row.value : null);
            });
        });

        // Fallback to Env if allowed/needed, but user requested tenant-specific.
        // We will pass what we found. The service handles fallback if passed null, but we prefer explicit.
        // If apiKey is null, service will try process.env or throw.
        
        // If audio file is provided, transcribe it
        if (req.file) {
            try {
                text = await voiceService.transcribeAudio(req.file.path, apiKey);
            } catch (e) {
                // If transcription fails (e.g. invalid key), cleanup and throw
                try { require('fs').unlinkSync(req.file.path); } catch (delErr) {}
                throw e;
            }
            // Clean up file
            try { require('fs').unlinkSync(req.file.path); } catch (e) {}
        }

        if (!text) {
            return res.status(400).json({ error: "No audio or text provided" });
        }

        console.log("Voice Command Text:", text);

        // Parse intent to get items
        const items = await voiceService.parseIntent(text, apiKey);
        
        if (!items || items.length === 0) {
             return res.json({ text, matches: [] });
        }

        // Match items with database products
        const matchedItems = [];
        
        for (const item of items) {
            // Normalize product name for better matching
            const searchTerm = item.product.trim();
            if (!searchTerm) continue;

            // Try exact match first, then fuzzy
            const query = `SELECT * FROM products WHERE name LIKE ? OR name LIKE ? OR name LIKE ? LIMIT 1`;
            
            const product = await new Promise((resolve, reject) => {
                req.db.get(query, [`${searchTerm}`, `${searchTerm}%`, `%${searchTerm}%`], (err, row) => {
                    if (err) resolve(null); // Don't fail whole request
                    else resolve(row);
                });
            });

            if (product) {
                matchedItems.push({
                    ...product,
                    quantity: item.quantity || 1
                });
            }
        }

        res.json({ 
            text: text, 
            matches: matchedItems 
        });

    } catch (err) {
        console.error("Voice Command Error:", err);
        // Provide clear error if it's about the key
        if (err.message && err.message.includes("OpenAI API Key")) {
            return res.status(400).json({ error: "OpenAI API Key is missing or invalid. Please check Settings." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/connection-info', (req, res) => {
    res.json({
        publicUrl: global.publicUrl || null,
        localIps: global.localIps || []
    });
});

// --- Customer & Loyalty Routes ---

app.get('/api/customers', authMiddleware, (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);

    const sql = "SELECT * FROM customers WHERE phoneNumber LIKE ? OR cardNumber LIKE ? OR name LIKE ?";
    const search = `%${query}%`;
    req.db.all(sql, [search, search, search], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/customers', authMiddleware, (req, res) => {
    const { name, phoneNumber, cardNumber } = req.body;
    if (!name || (!phoneNumber && !cardNumber)) {
        return res.status(400).json({ error: "Name and either Phone or Card Number are required" });
    }

    req.db.run(
        "INSERT INTO customers (name, phoneNumber, cardNumber) VALUES (?, ?, ?)",
        [name, phoneNumber, cardNumber],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed') || err.message.includes('Duplicate entry')) {
                     return res.status(400).json({ error: "Customer with this Card Number already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, phoneNumber, cardNumber, loyaltyPoints: 0 });
        }
    );
});

app.get('/api/customers/:id', authMiddleware, (req, res) => {
    req.db.get("SELECT * FROM customers WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Customer not found" });
        res.json(row);
    });
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Prevent index.html fallback for missing static assets
app.get(/\.(js|css|map|ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot|json)$/, (req, res) => {
    res.status(404).send('Resource not found');
});

// Handle React routing, return all requests to React app
app.get(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
         res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    }
});

// Helper: Test DB Connection
const testConnection = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                return reject(err);
            }
            connection.release();
            resolve();
        });
    });
};

// Start Server Logic
const startServer = async (port) => {
    const portToUse = port || PORT;
    
    try {
        console.log("Testing Database Connection...");
        try {
            await testConnection();
            console.log("Database Connection Successful (MySQL).");
        } catch (e) {
            console.warn("MySQL Connection Failed:", e.message);
            console.log("Proceeding with Server Startup (Using SQLite fallback)...");
        }
        
        app.listen(portToUse, '0.0.0.0', () => {
            console.log(`Server is running on http://0.0.0.0:${portToUse}`);
            
            // Print LAN IP
            const { networkInterfaces } = require('os');
            const nets = networkInterfaces();
            const ips = [];
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    if (net.family === 'IPv4' && !net.internal) {
                        const ip = `http://${net.address}:${portToUse}`;
                        console.log(`Network Access: ${ip}`);
                        ips.push(ip);
                    }
                }
            }
            
            // Start Public Tunnel (Only if explicitly enabled)
            if (process.env.USE_LOCALTUNNEL === 'true') {
                try {
                    const localtunnel = require('localtunnel');
                    (async () => {
                        try {
                            const tunnel = await localtunnel({ port: portToUse });
                            console.log(`Public Internet Access: ${tunnel.url}`);
                            global.publicUrl = tunnel.url;
                            global.localIps = ips;
                            
                            tunnel.on('close', () => {
                                console.log('Public tunnel closed');
                            });
                            tunnel.on('error', (err) => {
                                console.error('Localtunnel error:', err.message);
                            });
                        } catch (err) {
                            console.error('Failed to initialize localtunnel:', err.message);
                        }
                    })();
                } catch (err) {
                    console.error('Failed to start public tunnel:', err);
                }
            }
        });
        
    } catch (dbError) {
        console.error("CRITICAL: Database Connection Failed!", dbError.message);
        
        // Start Fallback Server to show error in browser (Instead of 503 crash)
        const http = require('http');
        const fallbackApp = http.createServer((req, res) => {
            // Add CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            // Handle Preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // Check if request is for API (expecting JSON)
            if (req.url.startsWith('/api')) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: "Database Connection Failed", 
                    details: dbError.message 
                }));
                return;
            }

            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                    <h1>500 Internal Server Error</h1>
                    <p>The application failed to start due to a database connection error.</p>
                    <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 5px; text-align: left; display: inline-block;">
                        <strong>Error Details:</strong>
                        <pre>${dbError.message}</pre>
                    </div>
                    <p>Please check your <code>.env</code> configuration and ensure MySQL is running.</p>
                </body>
                </html>
            `);
        });
        
        fallbackApp.listen(portToUse, '0.0.0.0', () => {
            console.log(`Fallback Server running on port ${portToUse} to display error.`);
        });
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
