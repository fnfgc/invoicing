import React, { useState, useEffect } from 'react';
import api, { getServerUrl } from './api'; // Use our configured API instance
import { Capacitor } from '@capacitor/core';
import ConnectServer from './ConnectServer';
import SuperAdminView from './SuperAdminView';
import SignupView from './SignupView';
import ErrorBoundary from './ErrorBoundary';
import { QRCodeSVG } from 'qrcode.react';
import { ShoppingCart, Trash2, Printer, CheckCircle, Plus, Minus, Package, X, LayoutDashboard, Users, LogOut, Lock, Menu, Key, Settings, Search, Keyboard, Smartphone, Wifi, RefreshCw, AlertTriangle, TrendingUp, ShoppingBag } from 'lucide-react';
import './App.css';

function ShortcutsHelp({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="shortcuts-grid">
          <div className="shortcut-item">
            <kbd>F2</kbd>
            <span>Focus Search</span>
          </div>
          <div className="shortcut-item">
            <kbd>F12</kbd> / <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
            <span>Checkout</span>
          </div>
          <div className="shortcut-item">
            <kbd>Esc</kbd>
            <span>Close Modal / Clear Search</span>
          </div>
          <div className="shortcut-item">
            <kbd>Alt</kbd> + <kbd>C</kbd>
            <span>Clear Cart</span>
          </div>
          <div className="shortcut-item">
            <kbd>Alt</kbd> + <kbd>P</kbd>
            <span>Print Receipt</span>
          </div>
          <div className="shortcut-item">
            <kbd>Alt</kbd> + <kbd>N</kbd>
            <span>New Sale</span>
          </div>
           <div className="shortcut-item">
            <kbd>Alt</kbd> + <kbd>H</kbd>
            <span>Show Shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivationView({ onActivate, isExpired }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/api/activate', { key });
      if (res.data.success) {
        onActivate();
      } else {
        setError(res.data.message || 'Activation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Activation failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Key size={40} color={isExpired ? "#e74c3c" : "#27ae60"} />
          <h2>{isExpired ? "License Expired" : "Product Activation"}</h2>
          <p>{isExpired ? "Your license has expired. Please enter a new key." : "Please enter your product key to continue."}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Key</label>
            <input 
              type="text" 
              value={key} 
              onChange={e => setKey(e.target.value.toUpperCase())} 
              placeholder="FNF-PRO-XXXX-XXXX"
              required 
              autoFocus
              className="form-control"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verifying...' : (isExpired ? 'Renew License' : 'Activate Software')}
          </button>
        </form>
        <div className="login-footer">
          <p>Need a key? Contact FNF Group</p>
          <p>www.fnfgc.com</p>
        </div>
      </div>
    </div>
  );
}

// --- Login Component ---
function Login({ onLogin, onSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Updated to match SaaS Login API (email/password)
      const res = await api.post('/api/login', { email: username, password });
      
      if (res.data.success || res.data.token) {
        // Store Token
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          // Also store user details if needed
          localStorage.setItem('user_role', res.data.role);
        }
        onLogin({
          name: res.data.name || 'User',
          role: res.data.role || 'cashier',
          email: username
        });
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-placeholder">FNF</div>
          <h2>POS System Login</h2>
          <p>Enter your credentials to access the system</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email / Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="user@business.com"
              required 
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="form-control"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn">
            <Lock size={18} style={{ marginRight: '8px' }} />
            Login
          </button>
        </form>
        <div className="login-footer">
          <p>Powered by FNF Group Solutions | www.fnfgc.com</p>
          <button className="link-btn" onClick={onSignup} style={{marginTop: '1rem', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem'}}>
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null); // Auth state
  const [showSignup, setShowSignup] = useState(false); // New state for signup view
  const [isActivated, setIsActivated] = useState(null); // null = loading, false = need key, true = active
  const [isExpired, setIsExpired] = useState(false); // New state for expired
  const [view, setView] = useState('pos'); // 'pos', 'inventory', 'dashboard', 'users', 'settings'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState({}); // Business Settings
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const searchInputRef = React.useRef(null);
  
  // Checkout Form State
  const [buyerInfo, setBuyerInfo] = useState({
    name: 'Walk-in Customer',
    cnic: '99999-9999999-9',
    ntn: '',
    phone: ''
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  // Check activation status on load
  useEffect(() => {
    checkActivation();
  }, []);

  const checkActivation = async () => {
    try {
      const res = await api.get('/api/activation/status');
      if (res.data.activated) {
          setIsActivated(true);
          setIsExpired(false);
      } else if (res.data.expired) {
          setIsActivated(false);
          setIsExpired(true);
      } else {
          setIsActivated(false);
          setIsExpired(false);
      }
    } catch (err) {
      console.error("Failed to check activation", err);
      setConnectionError(err.message || "Failed to connect to server");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input (except for specific function keys)
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
      
      // Global Shortcuts
      if (e.key === 'F2') {
        e.preventDefault();
        setView('pos');
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }

      // POS View Shortcuts
      if (view === 'pos' && !isReceiptOpen && !isCheckoutOpen) {
         if (e.altKey && e.key.toLowerCase() === 'c') {
            e.preventDefault();
            if (confirm('Clear cart?')) setCart([]);
         }

         if ((e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) && cart.length > 0) {
            e.preventDefault();
            setIsCheckoutOpen(true);
         }
      }

      // Receipt View Shortcuts
      if (isReceiptOpen) {
        if (e.altKey && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          window.print();
        }
        if (e.altKey && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setIsReceiptOpen(false);
        }
      }

      // General Modal Handling
      if (e.key === 'Escape') {
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isCheckoutOpen) setIsCheckoutOpen(false);
        else if (isReceiptOpen) setIsReceiptOpen(false);
        else if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        else if (document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isReceiptOpen, isCheckoutOpen, isShortcutsOpen, isMobileMenuOpen, cart]);

  // Check for saved user session
  useEffect(() => {
    if (isActivated) {
      const savedUser = localStorage.getItem('pos_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [isActivated]);

  // Fetch products and settings on load
  useEffect(() => {
    if (user && isActivated) {
      fetchProducts();
      fetchSettings();
    }
  }, [user, isActivated]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('pos_user', JSON.stringify(userData));
    fetchProducts();
    fetchSettings();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pos_user');
    setView('pos');
    setCart([]);
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  // Check for native connection
  if (Capacitor.isNativePlatform() && !getServerUrl()) {
    return <ConnectServer />;
  }

  if (connectionError) {
    return (
      <div className="error-screen" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', color: '#333'}}>
        <h2 style={{color: '#e74c3c'}}>Connection Failed</h2>
        <p style={{textAlign: 'center', maxWidth: '400px'}}>{connectionError}</p>
        <p style={{fontSize: '0.9rem', color: '#666'}}>Please check if the server is running on port 3000.</p>
        <button 
          onClick={() => { setConnectionError(null); checkActivation(); }} 
          style={{
            padding: '10px 20px', 
            cursor: 'pointer', 
            background: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '1rem'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isActivated === null) {
    return <div className="loading-screen">Loading System...</div>;
  }

  if (!isActivated) {
    return <ActivationView onActivate={() => { setIsActivated(true); setIsExpired(false); }} isExpired={isExpired} />;
  }

  if (!user) {
    if (showSignup) {
      return <SignupView onBack={() => setShowSignup(false)} />;
    }
    return <Login onLogin={handleLogin} onSignup={() => setShowSignup(true)} />;
  }

  if (user.role === 'superadmin' || user.email === 'superadmin@fnf.com') {
    return (
      <ErrorBoundary>
        <SuperAdminView onLogout={handleLogout} />
      </ErrorBoundary>
    );
  }

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert("Item is out of stock!");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert("Cannot add more than available stock!");
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = item.quantity + delta;
        
        if (newQty > product.stock) {
          alert("Cannot exceed available stock!");
          return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = cart.reduce((sum, item) => sum + ((item.price * item.quantity) * (item.taxRate / 100)), 0);
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      items: cart,
      buyerName: buyerInfo.name,
      buyerCNIC: buyerInfo.cnic,
      buyerNTN: buyerInfo.ntn,
      buyerPhone: buyerInfo.phone,
      discount: 0,
      totalAmount: calculateTotal().total
    };

    try {
      const response = await api.post('/api/invoices', payload);
      if (response.data.success) {
        setInvoiceData({
          InvoiceNumber: response.data.invoiceNumber,
          fbrInvoiceId: response.data.fbrResponse?.InvoiceNumber,
          fbrResponse: response.data.fbrResponse,
          items: cart,
          buyerInfo,
          totals: calculateTotal()
        });
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        setCart([]);
        fetchProducts(); // Refresh stock
      }
    } catch (error) {
      alert("Error processing invoice: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="app-container">
      {isReceiptOpen && invoiceData && (
        <ReceiptView 
          data={invoiceData} 
          settings={settings}
          onClose={() => setIsReceiptOpen(false)} 
        />
      )}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-area">
            <h1>FNF Group POS</h1>
            <span className="status-badge">{user.role.toUpperCase()}</span>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <div className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="mobile-user-info">
             <div className="user-welcome">Welcome, {user.name}</div>
             <div className="app-meta">FNF Group | v1.0.0</div>
          </div>
          <button 
            className={`nav-btn ${view === 'pos' ? 'active' : ''}`}
            onClick={() => handleViewChange('pos')}
          >
            <ShoppingCart size={18} /> POS
          </button>
          
          {(user.role === 'admin' || user.role === 'stock_manager' || user.role === 'owner') && (
            <>
              <button 
                className={`nav-btn ${view === 'inventory' ? 'active' : ''}`}
                onClick={() => handleViewChange('inventory')}
              >
                <Package size={18} /> Inventory
              </button>
              <button 
                className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleViewChange('dashboard')}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>
            </>
          )}

          {(user.role === 'owner' || user.role === 'admin') && (
            <>
              <button 
                className={`nav-btn ${view === 'users' ? 'active' : ''}`}
                onClick={() => handleViewChange('users')}
              >
                <Users size={18} /> Users
              </button>
              <button 
                className={`nav-btn ${view === 'settings' ? 'active' : ''}`}
                onClick={() => handleViewChange('settings')}
              >
                <Settings size={18} /> Settings
              </button>
            </>
          )}
          
          <button 
            className="nav-btn"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (Alt+H)"
          >
            <Keyboard size={18} /> Shortcuts
          </button>

          <button className="nav-btn logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
        
        <div className="header-user desktop-only">
           <div className="user-welcome">Welcome, {user.name}</div>
           <div className="app-meta">FNF Group | v1.0.0</div>
        </div>
      </header>

      {view === 'pos' && (
        <div className="pos-layout">
          <div className="pos-main-content">
            <div className="pos-header-bar">
               <div className="search-container">
                  <Search className="search-icon" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products (F2)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute', 
                        right: '10px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: '#94a3b8'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
               </div>
            </div>
            <div className="products-grid">
              {products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock < 5;
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`product-card ${isOutOfStock ? 'out-of-stock' : ''} ${isLowStock ? 'low-stock' : ''}`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <div className="card-content">
                        <h3>{product.name}</h3>
                        <p className="product-price">PKR {product.price}</p>
                        <div className="stock-badge">
                          {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
                        </div>
                      </div>
                      {!isOutOfStock && (
                        <div className="add-overlay">
                          <Plus size={24} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="cart-panel">
            <div className="cart-header">
              <ShoppingCart size={20} /> Current Order
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={48} />
                <p>Your cart is empty</p>
                <p style={{fontSize: '0.9rem'}}>Add items from the list to start</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p className="cart-item-price">PKR {item.price}</p>
                    </div>
                    <div className="cart-item-controls">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary-row">
                  <span>Subtotal:</span>
                  <span>PKR {calculateTotal().subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Tax (17%):</span>
                  <span>PKR {calculateTotal().tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="cart-summary-row total">
                  <span>Total:</span>
                  <span>PKR {calculateTotal().total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <button 
                  className="checkout-btn" 
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'inventory' && <InventoryView products={products} onUpdate={fetchProducts} user={user} />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'users' && <UserManagementView />}
      {view === 'settings' && <SettingsView settings={settings} onUpdate={fetchSettings} />}

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <ShortcutsHelp onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Customer Details</h2>
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  value={buyerInfo.name} 
                  onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>CNIC (99999-9999999-9)</label>
                <input 
                  value={buyerInfo.cnic} 
                  onChange={e => setBuyerInfo({...buyerInfo, cnic: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Phone (Optional)</label>
                <input 
                  value={buyerInfo.phone} 
                  onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsCheckoutOpen(false)}>Cancel</button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryView({ products, onUpdate, user }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockUpdateQty, setStockUpdateQty] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    pctCode: '',
    taxRate: 17
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/products', {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        taxRate: parseFloat(formData.taxRate)
      });
      setIsAdding(false);
      setFormData({ name: '', price: '', stock: '', pctCode: '', taxRate: 17 });
      onUpdate();
    } catch (err) {
      alert("Failed to add product");
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImportStatus('Reading file...');
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle CSV parsing considering potential quotes (simple version)
        // For now, simple split by comma
        const values = lines[i].split(',');
        const product = {};
        
        headers.forEach((header, index) => {
           // Basic mapping
           let key = header.toLowerCase().replace(/[\s_]+/g, '');
           if (key === 'name' || key === 'productname') key = 'name';
           else if (key === 'price' || key === 'retailprice') key = 'price';
           else if (key === 'stock' || key === 'quantity' || key === 'qty') key = 'stock';
           else if (key === 'balanceqty') key = 'balance_qty'; // Special handling
           else if (key === 'pctcode' || key === 'pct') key = 'pctCode';
           
           if (values[index] !== undefined) {
             product[header] = values[index].trim(); // Keep original key for server to handle too if needed, but we mapped locally
             // Also store mapped key for easier server handling if we want to standardize here
             if (key === 'name') product.name = values[index].trim();
             if (key === 'price') product.price = values[index].trim();
             if (key === 'stock') product.quantity = values[index].trim();
             if (key === 'balance_qty') product.balance_qty = values[index].trim();
             if (key === 'pctCode') product.pctCode = values[index].trim();
           }
        });
        
        if (product.name) products.push(product);
      }

      setImportStatus(`Importing ${products.length} products...`);
      
      try {
        const res = await api.post('/api/products/import', { products });
        alert(`Successfully imported ${res.data.count} products!`);
        setImportFile(null);
        setIsImporting(false);
        setImportStatus('');
        onUpdate();
      } catch (err) {
        setImportStatus('Import failed: ' + (err.response?.data?.error || err.message));
      }
    };
    reader.readAsText(importFile);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/${id}`);
        onUpdate();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/products/${selectedProduct.id}/stock`, {
        quantity: parseInt(stockUpdateQty)
      });
      setIsUpdatingStock(false);
      setStockUpdateQty('');
      setSelectedProduct(null);
      onUpdate();
    } catch (err) {
      alert("Failed to update stock");
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockUpdateQty('');
    setIsUpdatingStock(true);
  };

  return (
    <div className="inventory-layout">
      <div className="inventory-header">
        <h2>Product Inventory</h2>
        {(user.role === 'owner' || user.role === 'admin') && (
          <div style={{display: 'flex', gap: '10px'}}>
             <button className="secondary-btn" onClick={() => setIsImporting(true)}>
              <Package size={18} /> Import CSV
            </button>
            <button className="add-btn" onClick={() => setIsAdding(true)}>
              <Plus size={18} /> Add Product
            </button>
          </div>
        )}
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>PCT Code</th>
              <th>Tax %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.price}</td>
                <td>{p.stock}</td>
                <td>{p.pctCode}</td>
                <td>{p.taxRate}%</td>
                <td>
                  <button 
                    className="action-btn success" 
                    title="Add Stock"
                    onClick={() => openStockModal(p)}
                  >
                    <Plus size={16} />
                  </button>
                  {user.role === 'admin' && (
                    <button className="action-btn danger" onClick={() => handleDelete(p.id)} style={{marginLeft: '0.5rem'}}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isImporting && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Import Products (CSV)</h2>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label>Select CSV File</label>
                <input 
                  type="file" 
                  accept=".csv"
                  required 
                  onChange={e => setImportFile(e.target.files[0])}
                  className="form-control"
                />
                <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
                  Expected columns: Name, Price, Stock (or Quantity), PCT Code
                </small>
              </div>
              
              {importStatus && (
                <div className="message-box info" style={{marginTop: '10px'}}>
                  {importStatus}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setIsImporting(false)}>Cancel</button>
                <button type="submit" disabled={!importFile}>Import Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Product</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>PCT Code</label>
                  <input required value={formData.pctCode} onChange={e => setFormData({...formData, pctCode: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input type="number" required value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUpdatingStock && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Stock: {selectedProduct?.name}</h2>
            <form onSubmit={handleStockUpdate}>
              <div className="form-group">
                <label>Quantity to Add</label>
                <input 
                  type="number" 
                  min="1"
                  required 
                  value={stockUpdateQty} 
                  onChange={e => setStockUpdateQty(e.target.value)} 
                  placeholder="Enter quantity received"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsUpdatingStock(false)}>Cancel</button>
                <button type="submit">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptView({ data, settings, onClose }) {
  const printReceipt = () => {
    window.print();
  };

  // Use invoice date or fallback to current
  const invoiceDate = data.date ? new Date(data.date).toLocaleString() : new Date().toLocaleString();

  return (
    <div className="receipt-container">
      <div className="receipt-paper">
        <button className="close-receipt-btn no-print" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="receipt-header">
          <h2>{settings.business_name || 'Business Name'}</h2>
          <p>{settings.business_address || 'Business Address'}</p>
          <p>Contact: {settings.business_contact || 'N/A'}</p>
          <p>NTN: {settings.business_ntn || '0000000-0'}</p>
          <p>STRN: {settings.business_strn || '0000000000000'}</p>
          {settings.pos_id && <p>POS ID: {settings.pos_id}</p>}
        </div>
        
        <div className="receipt-info">
          <p><strong>Invoice #:</strong> <span>{data.InvoiceNumber}</span></p>
          <div className="fbr-details" style={{ margin: '5px 0', padding: '5px', border: '1px dashed #000' }}>
            <p><strong>FBR Invoice #:</strong> <span>{data.fbrInvoiceId || "PENDING"}</span></p>
          </div>
          <p><strong>Date:</strong> <span>{invoiceDate}</span></p>
          <p><strong>Customer:</strong> <span>{data.buyerInfo.name}</span></p>
          {data.buyerInfo.cnic !== "99999-9999999-9" && <p><strong>CNIC:</strong> <span>{data.buyerInfo.cnic}</span></p>}
        </div>

        <table className="receipt-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-totals">
          <div className="row">
            <span>Subtotal:</span>
            <span>{data.totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="row">
            <span>GST (17%):</span>
            <span>{data.totals.tax.toFixed(2)}</span>
          </div>
          <div className="row total">
            <span>Total:</span>
            <span>{data.totals.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="receipt-footer">
          <div className="qr-section">
            <QRCodeSVG value={data.fbrInvoiceId || data.InvoiceNumber || "N/A"} size={100} level="M" />
            <p className="fbr-verify">Verify with FBR</p>
          </div>
          <p className="thank-you">Thank you for your business!</p>
          <p className="software-credit">FNF Group - fnfgc.com - 03020010222</p>
        </div>

        <div className="receipt-actions no-print">
          <button onClick={printReceipt}><Printer size={16}/> Print</button>
          <button onClick={onClose}><CheckCircle size={16}/> New Sale</button>
        </div>
      </div>
    </div>
  );
}


function DashboardView() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/api/dashboard');
      setStats(res.data.stats);
      setLowStock(res.data.lowStockItems);
      setRecentTx(res.data.recentTransactions);
      setConnectionInfo(res.data.connectionInfo);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <h2>Business Dashboard</h2>
        <button className="primary-btn" onClick={fetchDashboardData}>
          <RefreshCw size={18} /> Refresh Data
        </button>
      </div>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
             <div className="stat-icon" style={{background: '#dbeafe', color: '#1d4ed8', padding: '10px', borderRadius: '50%', marginBottom: '10px', width: 'fit-content'}}>
                <TrendingUp size={24} />
             </div>
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">PKR {stats.revenue.toLocaleString()}</span>
          </div>
          <div className="stat-card">
             <div className="stat-icon" style={{background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '50%', marginBottom: '10px', width: 'fit-content'}}>
                <ShoppingBag size={24} />
             </div>
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.orders}</span>
          </div>
          <div className="stat-card">
             <div className="stat-icon" style={{background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '50%', marginBottom: '10px', width: 'fit-content'}}>
                <AlertTriangle size={24} />
             </div>
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value" style={{color: stats.lowStockCount > 0 ? 'var(--danger-color)' : 'inherit'}}>
              {stats.lowStockCount}
            </span>
          </div>
        </div>
      )}

      {connectionInfo && (
        <div className="dashboard-section">
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem'}}>
             <Smartphone size={24} color="var(--accent-color)" />
             <h3 style={{margin:0, fontSize: '1.1rem'}}>Mobile Access</h3>
          </div>
          
          <div className="mobile-access-container">
            {connectionInfo.publicUrl && (
              <div className="qr-code-card">
                <QRCodeSVG value={connectionInfo.publicUrl} size={128} />
                <p className="qr-label">Any Wi-Fi / Internet</p>
                <code className="qr-url">{connectionInfo.publicUrl}</code>
              </div>
            )}
            
            {connectionInfo.localIps.map(ip => (
               <div key={ip} className="qr-code-card">
                <QRCodeSVG value={ip} size={128} />
                <p className="qr-label" style={{color: 'var(--success-color)'}}>Local Wi-Fi Only</p>
                <code className="qr-url">{ip}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h3 className="section-title">Recent Transactions</h3>
        {recentTx.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>FBR Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx, idx) => (
                  <tr key={idx}>
                    <td>{tx.invoiceNumber || 'N/A'}</td>
                    <td>{new Date(tx.date).toLocaleString()}</td>
                    <td>PKR {tx.totalAmount ? tx.totalAmount.toFixed(2) : '0.00'}</td>
                    <td><span className="badge badge-success">Reported</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h3 className="section-title" style={{color: 'var(--danger-color)'}}>Low Stock Alerts</h3>
        {lowStock.length === 0 ? (
          <p>All items are well stocked.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td style={{fontWeight: 'bold', color: 'var(--danger-color)'}}>{item.stock}</td>
                    <td>PKR {item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // New state for editing
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'cashier' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/api/users/${editingUser.id}`, {
            ...formData,
            // If password is empty, don't send it (or backend ignores empty)
            password: formData.password 
        });
        alert("User updated successfully!");
      } else {
        // Create new user
        await api.post('/api/users', formData);
        alert("User created successfully!");
      }
      
      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
        name: user.name,
        username: user.username,
        password: '', // Don't show current password hash
        role: user.role
    });
    setIsAdding(true); // Open the modal
  };

  const closeModal = () => {
      setIsAdding(false);
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', role: 'cashier' });
      setError('');
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <h2>User Management</h2>
        <button className="primary-btn" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' || u.role === 'owner' ? 'badge-info' : 'badge-success'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button 
                    className="action-btn success" 
                    onClick={() => handleEdit(u)}
                    title="Edit User"
                    style={{marginRight: '5px'}}
                  >
                    <Plus size={18} style={{transform: 'rotate(45deg)'}} /> {/* Reusing Plus icon rotated looks like Edit/Pencil roughly, or just use text if no icon available */}
                  </button>
                  <button 
                    className="action-btn danger" 
                    onClick={() => handleDelete(u.id)}
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                  No users found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{padding: '1.5rem'}}>
              {error && (
                <div className="message-box error" style={{marginBottom: '1rem'}}>
                  <AlertTriangle size={16} style={{verticalAlign: 'middle', marginRight: '6px'}}/>
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text"
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Username (Login ID)</label>
                <input 
                  type="text"
                  required 
                  disabled={!!editingUser} // Disable username edit
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="e.g. john_cashier"
                  className="form-control"
                />
                {!editingUser && <small style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>Must be unique across the system.</small>}
              </div>
              
              <div className="form-group">
                <label>{editingUser ? 'New Password (Optional)' : 'Password'}</label>
                <input 
                  type="password"
                  required={!editingUser} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder={editingUser ? "Leave blank to keep current" : "******"}
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="form-control"
                >
                  <option value="cashier">Cashier (POS Only)</option>
                  <option value="stock_manager">Stock Manager (Inventory)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ settings, onUpdate }) {
  const [activeView, setActiveView] = useState('general');
  const [formData, setFormData] = useState({
    business_name: settings.business_name || '',
    business_address: settings.business_address || '',
    business_contact: settings.business_contact || '',
    business_ntn: settings.business_ntn || '',
    business_strn: settings.business_strn || '',
    pos_id: settings.pos_id || ''
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    // Update form data when settings prop changes
    setFormData({
        business_name: settings.business_name || '',
        business_address: settings.business_address || '',
        business_contact: settings.business_contact || '',
        business_ntn: settings.business_ntn || '',
        business_strn: settings.business_strn || '',
        pos_id: settings.pos_id || ''
    });
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/settings', formData);
      setMsg('Settings updated successfully!');
      onUpdate();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSales = async (e) => {
      e.preventDefault();
      if (!importFile) return;

      setImportStatus('Reading file...');
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n');
        
        // CSV Parsing Logic
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_]+/g, ''));
        const invoicesMap = {}; 

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          // Handle potential quotes in CSV (basic handling)
          const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          let invoiceNo = '';
          let date = '';
          let customer = '';
          let total = 0;
          let product = '';
          let qty = 0;
          let price = 0;
          let cnic = '';
          let ntn = '';

          headers.forEach((h, idx) => {
              let val = values[idx]?.trim().replace(/^"|"$/g, ''); // Remove quotes
              if (!val) return;
              
              if (h.includes('invoiceno') || h === 'id' || h === 'inv') invoiceNo = val;
              else if (h.includes('date')) date = val;
              else if (h.includes('customer') || h.includes('buyer') || h === 'name') customer = val;
              else if (h.includes('total') || h === 'amount') total = parseFloat(val);
              else if (h.includes('product') || h === 'item') product = val;
              else if (h.includes('qty') || h.includes('quantity')) qty = parseFloat(val);
              else if (h.includes('price') || h === 'rate') price = parseFloat(val);
              else if (h.includes('cnic')) cnic = val;
              else if (h.includes('ntn')) ntn = val;
          });

          if (!invoiceNo) continue;

          if (!invoicesMap[invoiceNo]) {
              invoicesMap[invoiceNo] = {
                  invoiceNumber: invoiceNo,
                  date: date,
                  buyerName: customer,
                  buyerCNIC: cnic,
                  buyerNTN: ntn,
                  totalAmount: total, 
                  items: []
              };
          }
          
          if (product) {
              invoicesMap[invoiceNo].items.push({
                  name: product,
                  quantity: qty || 1,
                  price: price || 0
              });
          }
        }

        const invoices = Object.values(invoicesMap).map(inv => {
            if (inv.items.length > 0) {
                 const calculatedTotal = inv.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                 // Prefer CSV total if available, else calculated
                 if (!inv.totalAmount || isNaN(inv.totalAmount)) inv.totalAmount = calculatedTotal;
            }
            return inv;
        });

        if (invoices.length === 0) {
            setImportStatus('No valid invoices found in CSV.');
            return;
        }

        setImportStatus(`Importing ${invoices.length} invoices...`);
        try {
          const res = await api.post('/api/invoices/import', { invoices });
          let statusMsg = `Successfully imported ${res.data.count} invoices!`;
          if (res.data.errors && res.data.errors.length > 0) {
              statusMsg += ` (${res.data.errors.length} failed/skipped)`;
              console.error("Import Errors:", res.data.errors);
          }
          alert(statusMsg);
          setImportFile(null);
          setImportStatus('');
        } catch (err) {
          setImportStatus('Import failed: ' + (err.response?.data?.error || err.message));
        }
      };
      reader.readAsText(importFile);
  };

  return (
    <div className="settings-layout">
      <div className="settings-sidebar">
        <button 
          className={activeView === 'general' ? 'active' : ''} 
          onClick={() => setActiveView('general')}
        >
          General
        </button>
        <button 
          className={activeView === 'import' ? 'active' : ''} 
          onClick={() => setActiveView('import')}
        >
          Data Import
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-header">
            <h2>{activeView === 'general' ? 'Business Settings' : 'Data Import & Migration'}</h2>
        </div>
        
        {activeView === 'general' ? (
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>Business Name</label>
            <input 
              value={formData.business_name} 
              onChange={e => setFormData({...formData, business_name: e.target.value})}
              placeholder="Enter Business Name"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Address</label>
            <textarea 
              value={formData.business_address} 
              onChange={e => setFormData({...formData, business_address: e.target.value})}
              placeholder="Enter Business Address"
              rows="3"
              className="form-control"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact Number</label>
              <input 
                value={formData.business_contact} 
                onChange={e => setFormData({...formData, business_contact: e.target.value})}
                placeholder="0300-1234567"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>FBR POS ID</label>
              <input 
                value={formData.pos_id} 
                onChange={e => setFormData({...formData, pos_id: e.target.value})}
                placeholder="Enter FBR POS ID"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>NTN</label>
              <input 
                value={formData.business_ntn} 
                onChange={e => setFormData({...formData, business_ntn: e.target.value})}
                placeholder="Enter NTN"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>STRN</label>
              <input 
                value={formData.business_strn} 
                onChange={e => setFormData({...formData, business_strn: e.target.value})}
                placeholder="Enter STRN"
                className="form-control"
              />
            </div>
          </div>

          {msg && (
            <div className={`message-box ${msg.includes('Failed') ? 'error' : 'success'}`}>
              {msg}
            </div>
          )}
          
          <div className="settings-actions">
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
        ) : (
            <div className="settings-container" style={{maxWidth: '600px'}}>
                <div className="card" style={{padding: '1.5rem'}}>
                    <h3>Import Sales History</h3>
                    <p style={{color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5'}}>
                        Migrate your sales history from another software. Upload a CSV file with your past invoices.
                        <br/><br/>
                        <strong>Required Columns:</strong> <code>Invoice No</code>, <code>Total</code>
                        <br/>
                        <strong>Optional:</strong> <code>Date</code>, <code>Customer</code>, <code>Product</code>, <code>Qty</code>, <code>Price</code>
                    </p>
                    
                    <div style={{border: '2px dashed var(--border-color)', padding: '2rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem'}}>
                        <input 
                            type="file" 
                            accept=".csv"
                            onChange={e => setImportFile(e.target.files[0])}
                            style={{marginBottom: '1rem'}}
                        />
                        <div style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                            {importFile ? importFile.name : 'Drag & drop or click to select CSV'}
                        </div>
                    </div>

                    <button 
                        className="primary-btn" 
                        onClick={handleImportSales}
                        disabled={!importFile || isImporting}
                        style={{width: '100%'}}
                    >
                        {isImporting ? 'Importing...' : 'Upload & Import Invoices'}
                    </button>
                    
                    {importStatus && (
                        <div className="message-box info" style={{marginTop: '1rem'}}>
                            {importStatus}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
