import React, { useState, useEffect } from 'react';
import axios from './api'; // Use our configured API instance
import { Capacitor } from '@capacitor/core';
import { getServerUrl } from './api';
import ConnectServer from './ConnectServer';
import SuperAdminView from './SuperAdminView';
import { QRCodeSVG } from 'qrcode.react';
import { ShoppingCart, Trash2, Printer, CheckCircle, Plus, Minus, Package, X, LayoutDashboard, Users, LogOut, Lock, Menu, Key, Settings, Search, Keyboard, Smartphone, Wifi } from 'lucide-react';
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
      const res = await axios.post('/api/activate', { key });
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
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Updated to match SaaS Login API (email/password)
      const res = await axios.post('/api/login', { email: username, password });
      
      if (res.data.success || res.data.token) {
        // Store Token
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          // Also store user details if needed
          localStorage.setItem('user_role', res.data.role);
        }
        onLogin(res.data.role || 'cashier'); // 'owner', 'superadmin', 'cashier'
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
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn">
            <Lock size={18} style={{ marginRight: '8px' }} />
            Login
          </button>
        </form>
        <div className="login-footer">
          <p>Default Admin: superadmin@fnf.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null); // Auth state
  const [isActivated, setIsActivated] = useState(null); // null = loading, false = need key, true = active
  const [isExpired, setIsExpired] = useState(false); // New state for expired
  const [view, setView] = useState('pos'); // 'pos', 'inventory', 'dashboard', 'users', 'settings'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState({}); // Business Settings
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Check activation status on load
  useEffect(() => {
    checkActivation();
  }, []);

  const checkActivation = async () => {
    try {
      const res = await axios.get('/api/activation/status');
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
    return <Login onLogin={handleLogin} />;
  }

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

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
      discount: 0
    };

    try {
      const response = await axios.post('/api/invoices', payload);
      if (response.data.success) {
        setInvoiceData({
          ...response.data.data, // FBR response
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
          
          {(user.role === 'admin' || user.role === 'stock_manager') && (
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

          {user.role === 'admin' && (
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
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                <h3>{product.name}</h3>
                <p className="product-price">PKR {product.price}</p>
                <p className="product-stock">Stock: {product.stock}</p>
              </div>
            ))}
          </div>

          <div className="cart-panel">
            <div className="cart-header">
              <ShoppingCart size={20} /> Current Order
            </div>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>PKR {item.price} x {item.quantity}</p>
                  </div>
                  <div className="item-controls">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>PKR {calculateTotal().subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax (17%):</span>
                <span>PKR {calculateTotal().tax.toFixed(2)}</span>
              </div>
              <div className="total-row final">
                <span>Total:</span>
                <span>PKR {calculateTotal().total.toFixed(2)}</span>
              </div>
              <button 
                className="checkout-btn" 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
              >
                Proceed to Checkout
              </button>
            </div>
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
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockUpdateQty, setStockUpdateQty] = useState('');
  
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
      await axios.post('/api/products', {
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

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        onUpdate();
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/products/${selectedProduct.id}/stock`, {
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
        {user.role === 'admin' && (
          <button className="add-btn" onClick={() => setIsAdding(true)}>
            <Plus size={18} /> Add Product
          </button>
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
                    className="action-btn" 
                    title="Add Stock"
                    style={{marginRight: '8px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer'}}
                    onClick={() => openStockModal(p)}
                  >
                    <Plus size={16} />
                  </button>
                  {user.role === 'admin' && (
                    <button className="delete-icon-btn" onClick={() => handleDelete(p.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        </div>
        
        <div className="receipt-info">
          <p><strong>Invoice #:</strong> <span>{data.InvoiceNumber}</span></p>
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

        <div className="fbr-section">
          <div className="fbr-logo">
            <img src="https://fbr.gov.pk/assets/images/fbr-logo.png" alt="FBR" style={{height: '40px'}}/>
            <span>FBR POS ID: {data.POSID || '123456'}</span>
          </div>
          <div className="qr-code">
            <QRCodeSVG value={data.InvoiceNumber} size={100} />
          </div>
          <p className="fbr-number">FBR Invoice #: {data.InvoiceNumber}</p>
          <p className="verify-text">Verify this invoice through FBR Tax Asaan App</p>
        </div>
        
        <div className="receipt-footer">
            <p>Thank you for your business!</p>
            <p>Software Developed by FNF Group</p>
            <p>www.fnfgc.com | 03020010222</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      setStats(res.data.stats);
      setLowStock(res.data.lowStockItems);
      setRecentTx(res.data.recentTransactions);
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
        <button className="nav-btn active" onClick={fetchDashboardData} style={{width: 'auto', padding: '0.5rem 1rem'}}>
          Refresh Data
        </button>
      </div>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">PKR {stats.revenue.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.orders}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value" style={{color: stats.lowStockCount > 0 ? '#e74c3c' : 'inherit'}}>
              {stats.lowStockCount}
            </span>
          </div>
        </div>
      )}

      {connectionInfo && (
        <div className="dashboard-section" style={{background: '#f0f9ff', borderColor: '#bae6fd'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
            <Smartphone size={24} color="#0284c7" />
            <h3 className="section-title" style={{margin: 0, border: 'none', color: '#0369a1'}}>Mobile Access (Scan to Connect)</h3>
          </div>
          <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
            {connectionInfo.publicUrl && (
              <div style={{textAlign: 'center', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <QRCodeSVG value={connectionInfo.publicUrl} size={128} />
                <p style={{marginTop: '0.5rem', fontWeight: 'bold', color: '#0369a1'}}>Any Wi-Fi / Internet</p>
                <code style={{display: 'block', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px', borderRadius: '4px', marginTop: '4px'}}>
                  {connectionInfo.publicUrl}
                </code>
              </div>
            )}
            
            {connectionInfo.localIps.map(ip => (
               <div key={ip} style={{textAlign: 'center', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                <QRCodeSVG value={ip} size={128} />
                <p style={{marginTop: '0.5rem', fontWeight: 'bold', color: '#10b981'}}>Local Wi-Fi Only</p>
                <code style={{display: 'block', fontSize: '0.8rem', background: '#f1f5f9', padding: '4px', borderRadius: '4px', marginTop: '4px'}}>
                  {ip}
                </code>
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
                  <td><span className="status-badge">Reported</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboard-section">
        <h3 className="section-title" style={{color: '#e74c3c'}}>Low Stock Alerts</h3>
        {lowStock.length === 0 ? (
          <p>All items are well stocked.</p>
        ) : (
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
                  <td style={{fontWeight: 'bold', color: '#e74c3c'}}>{item.stock}</td>
                  <td>PKR {item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'cashier' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', formData);
      setIsAdding(false);
      setFormData({ name: '', username: '', password: '', role: 'cashier' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="users-layout">
      <div className="users-header">
        <h2>User Management</h2>
        <button className="add-btn" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
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
                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                <td>
                  <button className="delete-icon-btn" onClick={() => handleDelete(u.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New User</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="cashier">Cashier</option>
                  <option value="stock_manager">Stock Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="modal-actions">
                <button type="button" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ settings, onUpdate }) {
  const [formData, setFormData] = useState({
    business_name: settings.business_name || '',
    business_address: settings.business_address || '',
    business_contact: settings.business_contact || '',
    business_ntn: settings.business_ntn || '',
    business_strn: settings.business_strn || ''
  });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/settings', formData);
      setMsg('Settings updated successfully!');
      onUpdate();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Failed to update settings');
    }
  };

  return (
    <div className="settings-layout">
      <div className="settings-header">
        <h2>Business Settings</h2>
      </div>
      <div className="settings-container">
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group">
            <label>Business Name</label>
            <input 
              value={formData.business_name} 
              onChange={e => setFormData({...formData, business_name: e.target.value})}
              placeholder="Enter Business Name"
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input 
              value={formData.business_address} 
              onChange={e => setFormData({...formData, business_address: e.target.value})}
              placeholder="Enter Business Address"
            />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input 
              value={formData.business_contact} 
              onChange={e => setFormData({...formData, business_contact: e.target.value})}
              placeholder="Enter Contact Number"
            />
          </div>
          <div className="form-group">
            <label>NTN</label>
            <input 
              value={formData.business_ntn} 
              onChange={e => setFormData({...formData, business_ntn: e.target.value})}
              placeholder="Enter NTN"
            />
          </div>
          <div className="form-group">
            <label>STRN</label>
            <input 
              value={formData.business_strn} 
              onChange={e => setFormData({...formData, business_strn: e.target.value})}
              placeholder="Enter STRN"
            />
          </div>
          {msg && <p className="msg">{msg}</p>}
          <button type="submit" className="save-btn">Save Settings</button>
        </form>
      </div>
    </div>
  );
}

export default App;
