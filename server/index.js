const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sendToFBR } = require('./fbr');
const masterDB = require('./master_db');
const { getTenantDB } = require('./tenant_db_manager');
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

// Initialize Backup Service (Only if credentials exist)
const { startBackupService } = require('./services/backupService');
if (process.env.GOOGLE_CREDENTIALS_PATH || require('fs').existsSync(path.join(__dirname, '../google-credentials.json'))) {
    startBackupService();
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

            const token = jwt.sign({ 
                id: tenant.id, 
                tenantId: tenant.id, 
                role: role, 
                email: tenant.email 
            }, SECRET_KEY, { expiresIn: '24h' });

            return res.json({ success: true, token, role: role, name: tenant.business_name });
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

                    masterDB.get("SELECT is_active FROM tenants WHERE id = ?", [lookup.tenant_id], (err, tenantInfo) => {
                        if (tenantInfo && !tenantInfo.is_active) {
                            return res.status(403).json({ error: "Business account is inactive." });
                        }

                        const token = jwt.sign({ 
                            id: user.id, 
                            tenantId: lookup.tenant_id, 
                            role: user.role, 
                            username: user.username 
                        }, SECRET_KEY, { expiresIn: '24h' });

                        return res.json({ success: true, token, role: user.role, name: user.name });
                    });
                });
            } catch (e) {
                console.error("Login Critical Error:", e);
                return res.status(500).json({ error: "Failed to access tenant database" });
            }
        });
    });
});

// Super Admin Routes (Protected)

app.get('/api/packages', (req, res) => {
    masterDB.all("SELECT * FROM packages", (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(rows);
    });
});

app.post('/api/packages', authMiddleware, (req, res) => {
    if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
    
    const { name, price, duration_days, features } = req.body;
    masterDB.run("INSERT INTO packages (name, price, duration_days, features) VALUES (?, ?, ?, ?)",
        [name, price, duration_days, JSON.stringify(features)],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
    });
});

app.put('/api/packages/:id', authMiddleware, (req, res) => {
  if (req.user.email !== 'superadmin@fnf.com') return res.status(403).json({ error: "Forbidden" });
  
  const { id } = req.params;
  const { name, price, duration_days, features } = req.body;
  
  masterDB.run(
    "UPDATE packages SET name = ?, price = ?, duration_days = ?, features = ? WHERE id = ?",
    [name, price, duration_days, JSON.stringify(features), id],
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

// Public Registration
app.post('/api/register', (req, res) => {
    const { business_name, email, password, packageId } = req.body;
    
    if (!business_name || !email || !password || !packageId) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const hash = bcrypt.hashSync(password, 10);
    
    masterDB.get("SELECT * FROM packages WHERE id = ?", [packageId], (err, pkg) => {
        if (err || !pkg) return res.status(400).json({ error: "Invalid Package" });
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + pkg.duration_days);

        masterDB.run(`INSERT INTO tenants (business_name, email, password, plan, subscription_expiry, is_active) 
                      VALUES (?, ?, ?, ?, ?, 0)`, 
                      [business_name, email, hash, pkg.name, expiry.toISOString()], 
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
    const pool = req.db.pool.promise();

    try {
        await pool.query("START TRANSACTION");

        for (let i = 0; i < products.length; i++) {
            const prod = products[i];
            let finalStock = (prod.balance_qty !== undefined && prod.balance_qty !== '' && !isNaN(prod.balance_qty)) 
                             ? parseInt(prod.balance_qty) 
                             : parseInt(prod.quantity || prod.stock || 0);

            if (finalStock <= 1) finalStock = 100;

            const name = prod.name || prod.Name || "Unknown Product";
            const price = parseFloat(prod.price || prod.Price || 0);
            const pctCode = prod.pctCode || prod.PCT_Code || prod.pct_code || "";

            try {
                await pool.query("INSERT INTO products (name, price, stock, pctCode) VALUES (?, ?, ?, ?)", 
                    [name, price, finalStock, pctCode]);
                successCount++;
            } catch (err) {
                errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        await pool.query("COMMIT");
        res.json({ success: true, count: successCount, errors });

    } catch (err) {
        await pool.query("ROLLBACK");
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

app.get('/api/invoices', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM invoices ORDER BY id DESC LIMIT 50", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/invoices', authMiddleware, (req, res) => {
    let { totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, items } = req.body; 
    
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
    
    req.db.get("SELECT value FROM settings WHERE key = 'pos_id'", async (err, row) => {
        const posId = row ? row.value : null;

        try {
            const fbrResponse = await sendToFBR({ 
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
            }, posId);
            
            const invoiceNumber = `INV-${Date.now()}`;
            const date = new Date().toISOString();

            req.db.run(`INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse, items) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, JSON.stringify(fbrResponse), JSON.stringify(items)],
                    function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        
                        const pool = req.db.pool.promise();
                        (async () => {
                            try {
                                for (const item of items) {
                                    await pool.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity || 1, item.id]);
                                }
                            } catch (updateErr) {
                                console.error("Stock update failed:", updateErr);
                            }
                        })();

                        res.json({ success: true, invoiceNumber, fbrResponse });
                    }
            );
        } catch (fbrError) {
            console.error("FBR Error:", fbrError);
            const invoiceNumber = `INV-${Date.now()}`;
            const date = new Date().toISOString();
            const fbrErrorResponse = { error: fbrError.message, code: "FBR_FAILED" };

            req.db.run(`INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse, items) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, JSON.stringify(fbrErrorResponse), JSON.stringify(items)],
                    function(err) {
                        if (err) return res.status(500).json({ error: err.message });

                        const pool = req.db.pool.promise();
                        (async () => {
                            try {
                                for (const item of items) {
                                    await pool.query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity || 1, item.id]);
                                }
                            } catch (updateErr) {
                                console.error("Stock update failed:", updateErr);
                            }
                        })();

                        res.json({ success: true, invoiceNumber, fbrResponse: fbrErrorResponse, warning: "FBR integration failed" });
                    }
            );
        }
    });
});

app.post('/api/invoices/import', authMiddleware, async (req, res) => {
    const { invoices } = req.body;
    if (!invoices || !Array.isArray(invoices)) {
        return res.status(400).json({ error: "Invalid data. Expected 'invoices' array." });
    }

    let successCount = 0;
    let errors = [];
    const pool = req.db.pool.promise();

    try {
        await pool.query("START TRANSACTION");

        for (let i = 0; i < invoices.length; i++) {
            const inv = invoices[i];
            if (!inv.invoiceNumber || !inv.totalAmount) {
                errors.push(`Row ${i + 1}: Missing Invoice Number or Total`);
                continue;
            }

            const itemsJson = inv.items ? JSON.stringify(inv.items) : '[]';

            try {
                await pool.query(`INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, items) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    inv.invoiceNumber, 
                    inv.date || new Date().toISOString(), 
                    inv.totalAmount, 
                    inv.buyerName || 'Walk-in', 
                    inv.buyerCNIC || '', 
                    inv.buyerNTN || '',
                    itemsJson
                ]);
                successCount++;
            } catch (err) {
                if (err.message.includes('Duplicate entry') || err.code === 'ER_DUP_ENTRY') {
                    errors.push(`Invoice ${inv.invoiceNumber} already exists`);
                } else {
                    errors.push(`Invoice ${inv.invoiceNumber}: ${err.message}`);
                }
            }
        }

        await pool.query("COMMIT");
        res.json({ success: true, count: successCount, errors });

    } catch (err) {
        await pool.query("ROLLBACK");
        return res.status(500).json({ error: "Transaction failed", details: err.message });
    }
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
    const stats = { revenue: 0, orders: 0, lowStockCount: 0 };
    
    req.db.get("SELECT SUM(totalAmount) as revenue, COUNT(*) as orders FROM invoices", (err, row) => {
        if (row) {
            stats.revenue = row.revenue || 0;
            stats.orders = row.orders || 0;
        }

        req.db.get("SELECT COUNT(*) as low FROM products WHERE stock < 5", (err, row) => {
            if (row) stats.lowStockCount = row.low;

            req.db.all("SELECT * FROM products WHERE stock < 5", (err, lowStockItems) => {
                req.db.all("SELECT * FROM invoices ORDER BY id DESC LIMIT 5", (err, recentTransactions) => {
                    res.json({ stats, lowStockItems, recentTransactions });
                });
            });
        });
    });
});

app.get('/api/settings', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM settings", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
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

app.post('/api/settings', authMiddleware, async (req, res) => {
    if (req.user.role !== 'owner') {
        return res.status(403).json({ error: "Only the Business Owner can update settings." });
    }

    const settings = req.body;
    const pool = req.db.pool.promise();
    
    try {
        const keys = Object.keys(settings);
        for (const key of keys) {
            const value = typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : String(settings[key]);
            await pool.query("INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [key, value]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Error saving settings:", err);
        return res.status(500).json({ error: "Failed to save settings" });
    }
});

app.get('/api/connection-info', (req, res) => {
    res.json({
        publicUrl: global.publicUrl || null,
        localIps: global.localIps || []
    });
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

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
        await testConnection();
        console.log("Database Connection Successful.");
        
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
            res.writeHead(503, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                    <h1>503 Service Unavailable</h1>
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
