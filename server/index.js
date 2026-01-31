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

            const token = jwt.sign({ 
                id: tenant.id, 
                tenantId: tenant.id, // Owner IS the tenant
                role: 'owner', 
                email: tenant.email 
            }, SECRET_KEY, { expiresIn: '24h' });

            return res.json({ success: true, token, role: 'owner', name: tenant.business_name });
        }
        
        // If not found in Master DB, it might be a sub-user (e.g. cashier)
        // For simplicity in V1 SaaS, we recommend Business Owners create separate logins
        // But to support sub-users, we'd need to know WHICH tenant DB to check.
        // User could provide "Company ID" or we iterate.
        // For now, let's assume Super Admin Login via specific email:
        if (email === 'superadmin@fnf.com') {
             // Fallback if not in DB (though it should be)
             // ... handled by Master DB check above actually if seeded correctly.
        }

        return res.status(401).json({ error: "User not found or invalid credentials" });
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
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(rows);
    });
});

// Renew Subscription (Tenant Owner)
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
    
    // Simple FBR Mock integration
    const fbrResponse = sendToFBR({ totalAmount, buyerNTN });
    
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

app.post('/api/settings', authMiddleware, (req, res) => {
    const { storeName, address, phone } = req.body;
    req.db.serialize(() => {
        if(storeName) req.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('store_name', ?)", [storeName]);
        if(address) req.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('address', ?)", [address]);
        if(phone) req.db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('phone', ?)", [phone]);
    });
    res.json({ success: true });
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
