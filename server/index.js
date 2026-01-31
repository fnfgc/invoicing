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
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --- System Activation Check (Public) ---
app.get('/api/activation/status', (req, res) => {
    // For now, return always activated. 
    // In a real scenario, this might check a license file or DB.
    res.json({ activated: true, expired: false });
});

// --- Auth Routes (Public) ---

// Login (SaaS: Tenant or SuperAdmin)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body; // Changed from username to email for SaaS login

    // 1. Check Master DB for Tenants (Business Owners)
    masterDB.get("SELECT * FROM tenants WHERE email = ?", [email], (err, tenant) => {
        if (err) return res.status(500).json({ error: "Server Error" });
        
        if (tenant) {
            // It's a Business Owner
            if (!bcrypt.compareSync(password, tenant.password)) {
                return res.status(401).json({ error: "Invalid Credentials" });
            }

            // Check if account is active
            if (!tenant.is_active) {
                return res.status(403).json({ error: "Account is pending activation. Please wait for admin approval." });
            }

            const token = jwt.sign({ 
                id: tenant.id, 
                tenantId: tenant.id, // Owner IS the tenant
                role: 'owner', 
                email: tenant.email 
            }, SECRET_KEY, { expiresIn: '24h' });

            return res.json({ success: true, token, role: 'owner', name: tenant.business_name });
        }
        
        // If not found in Master DB, check User Lookup for Sub-users
        masterDB.get("SELECT tenant_id FROM user_lookup WHERE username = ?", [email], (err, lookup) => {
            if (err) return res.status(500).json({ error: "Server Error" });
            
            if (!lookup) {
                return res.status(401).json({ error: "User not found or invalid credentials" });
            }

            // Found the tenant, now check the Tenant DB
            try {
                const tenantDB = getTenantDB(lookup.tenant_id);
                tenantDB.get("SELECT * FROM users WHERE username = ?", [email], (err, user) => {
                    if (err || !user) return res.status(401).json({ error: "User not found in tenant DB" });

                    if (!bcrypt.compareSync(password, user.password)) {
                        return res.status(401).json({ error: "Invalid Credentials" });
                    }

                    // Check if Tenant Account is active (optional, but good practice)
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
                console.error(e);
                return res.status(500).json({ error: "Failed to access tenant database" });
            }
        });
    });
});

// Super Admin Routes (Protected)

// --- Packages API ---
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
    }
  );
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
    // Check if superadmin
    if (req.user.email !== 'superadmin@fnf.com') {
        return res.status(403).json({ error: "Forbidden. Super Admin only." });
    }

    const { business_name, email, password, packageId } = req.body; // Changed plan to packageId
    const hash = bcrypt.hashSync(password, 10);
    
    // Get Package Details
    masterDB.get("SELECT * FROM packages WHERE id = ?", [packageId], (err, pkg) => {
        if (err || !pkg) return res.status(400).json({ error: "Invalid Package" });
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + pkg.duration_days);

        masterDB.run(`INSERT INTO tenants (business_name, email, password, plan, subscription_expiry) 
                      VALUES (?, ?, ?, ?, ?)`, 
                      [business_name, email, hash, pkg.name, expiry.toISOString()], 
                      function(err) {
            if (err) return res.status(400).json({ error: err.message });
            
            // Initialize the Tenant DB immediately
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
    
    // Get Package Details
    masterDB.get("SELECT * FROM packages WHERE id = ?", [packageId], (err, pkg) => {
        if (err || !pkg) return res.status(400).json({ error: "Invalid Package" });
        
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + pkg.duration_days);

        // Create Tenant with is_active = 0 (Pending Verification)
        masterDB.run(`INSERT INTO tenants (business_name, email, password, plan, subscription_expiry, is_active) 
                      VALUES (?, ?, ?, ?, ?, 0)`, 
                      [business_name, email, hash, pkg.name, expiry.toISOString()], 
                      function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Email already registered" });
                return res.status(500).json({ error: err.message });
            }
            
            // Initialize the Tenant DB immediately
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
    // 1. Verify Tenant Owner
    if (req.user.role !== 'owner') {
        return res.status(403).json({ error: "Only the Business Owner can renew subscription." });
    }

    // 2. Get Current Tenant Info & Package
    masterDB.get("SELECT * FROM tenants WHERE id = ?", [req.user.tenantId], (err, tenant) => {
        if (err || !tenant) return res.status(404).json({ error: "Tenant not found" });

        // Find package by name (stored in 'plan')
        masterDB.get("SELECT * FROM packages WHERE name = ?", [tenant.plan], (err, pkg) => {
            // Default to 30 days if package not found (legacy)
            const duration = pkg ? pkg.duration_days : 30;
            
            // Calculate new expiry
            let currentExpiry = new Date(tenant.subscription_expiry);
            if (currentExpiry < new Date()) {
                currentExpiry = new Date(); // If already expired, start from today
            }
            currentExpiry.setDate(currentExpiry.getDate() + duration);

            // Update Master DB
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

// --- Tenant Routes (Protected by authMiddleware) ---
// Note: authMiddleware attaches `req.db` which is the correct SQLite connection for that tenant

app.get('/api/products', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM products", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/products', authMiddleware, (req, res) => {
    const { name, price, stock, pctCode } = req.body;
    req.db.run("INSERT INTO products (name, price, stock, pctCode) VALUES (?, ?, ?, ?)", 
        [name, price, stock, pctCode], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    req.db.run("DELETE FROM products WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.get('/api/invoices', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM invoices ORDER BY id DESC LIMIT 50", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/invoices', authMiddleware, (req, res) => {
    const { totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, items } = req.body; 
    
    // Get POS ID from settings
    req.db.get("SELECT value FROM settings WHERE key = 'pos_id'", async (err, row) => {
        const posId = row ? row.value : null;

        try {
            // Simple FBR Mock integration
            // Passing full items for proper FBR formatting
            const fbrResponse = await sendToFBR({ 
                totalAmount, 
                buyerNTN, 
                buyerCNIC,
                buyerName,
                buyerPhone,
                items: items.map(item => ({
                    ...item,
                    taxRate: item.taxRate || 0, // Ensure taxRate exists
                    quantity: item.quantity || 1
                }))
            }, posId);
            
            const invoiceNumber = `INV-${Date.now()}`;
            const date = new Date().toISOString();

            req.db.run(`INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, JSON.stringify(fbrResponse)],
                    function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, invoiceNumber, fbrResponse });
                    }
            );
        } catch (fbrError) {
            console.error("FBR Error:", fbrError);
            // Even if FBR fails, we might want to save the invoice locally but mark it?
            // For now, let's fail the request or save with error?
            // Let's save it but with error in fbrResponse field
            const invoiceNumber = `INV-${Date.now()}`;
            const date = new Date().toISOString();
            const fbrErrorResponse = { error: fbrError.message, code: "FBR_FAILED" };

            req.db.run(`INSERT INTO invoices (invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, fbrResponse) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [invoiceNumber, date, totalAmount, buyerName, buyerCNIC, buyerNTN, buyerPhone, JSON.stringify(fbrErrorResponse)],
                    function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, invoiceNumber, fbrResponse: fbrErrorResponse, warning: "FBR integration failed" });
                    }
            );
        }
    });
});

// Dashboard Stats
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

// Settings API
app.get('/api/settings', authMiddleware, (req, res) => {
    req.db.all("SELECT * FROM settings", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    });
});

// User Management Routes (Tenant Specific)
app.get('/api/users', authMiddleware, (req, res) => {
    req.db.all("SELECT id, name, username, role FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', authMiddleware, (req, res) => {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: "Missing required fields" });

    // Check if username already exists in Global Lookup
    masterDB.get("SELECT username FROM user_lookup WHERE username = ?", [username], (err, row) => {
        if (row) return res.status(400).json({ error: "Username is already taken globally. Please choose another." });

        // Hash Password
        const hash = bcrypt.hashSync(password, 10);

        // 1. Create in Tenant DB
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

                // 2. Add to Global Lookup
                masterDB.run("INSERT INTO user_lookup (username, tenant_id) VALUES (?, ?)", 
                    [username, req.user.tenantId], 
                    (err) => {
                        if (err) {
                            console.error("Failed to add to user_lookup", err);
                            // Rollback (delete from tenant DB) - simplified for now
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

app.delete('/api/users/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    
    // Get username first to delete from lookup
    req.db.get("SELECT username FROM users WHERE id = ?", [id], (err, user) => {
        if (!user) return res.status(404).json({ error: "User not found" });

        req.db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // Delete from Global Lookup
            masterDB.run("DELETE FROM user_lookup WHERE username = ?", [user.username]);
            
            res.json({ success: true, message: "User deleted" });
        });
    });
});

app.post('/api/settings', authMiddleware, (req, res) => {
    const settings = req.body;
    
    req.db.serialize(() => {
        const stmt = req.db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        
        Object.keys(settings).forEach(key => {
            // Convert value to string if it's not
            const value = typeof settings[key] === 'object' ? JSON.stringify(settings[key]) : String(settings[key]);
            stmt.run(key, value);
        });
        
        stmt.finalize((err) => {
            if (err) {
                console.error("Error saving settings:", err);
                return res.status(500).json({ error: "Failed to save settings" });
            }
            res.json({ success: true });
        });
    });
});

// Connection Info API (For Mobile)
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
    // Only if not an API call
    if (!req.path.startsWith('/api')) {
         res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
    }
});

// Start Server Logic
const startServer = async (port) => {
    const portToUse = port || PORT;
    
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
        
        // Start Public Tunnel (for "Any Wifi" access) - Only in Dev or if explicitly enabled
        if (process.env.NODE_ENV !== 'production') {
            try {
                const localtunnel = require('localtunnel');
                (async () => {
                    const tunnel = await localtunnel({ port: portToUse });
                    console.log(`Public Internet Access: ${tunnel.url}`);
                    
                    // Store tunnel URL in global variable or settings to display in UI
                    global.publicUrl = tunnel.url;
                    global.localIps = ips;
                    
                    tunnel.on('close', () => {
                        console.log('Public tunnel closed');
                    });
                })();
            } catch (err) {
                console.error('Failed to start public tunnel:', err);
            }
        }
    });
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
