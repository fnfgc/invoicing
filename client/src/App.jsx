import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { getServerUrl } from './api'; // Use our configured API instance
import { Capacitor } from '@capacitor/core';
import ConnectServer from './ConnectServer';
import SuperAdminView from './SuperAdminView';
import SignupView from './SignupView';
import ReportsView from './ReportsView';
import PartnersView from './PartnersView';
import ErrorBoundary from './ErrorBoundary';
import LanguageSwitcher from './LanguageSwitcher';
import { QRCodeSVG } from 'qrcode.react';
import { ShoppingCart, Trash2, Printer, CheckCircle, Plus, Minus, Package, X, LayoutDashboard, Users, LogOut, Lock, Menu, Key, Settings, Search, Keyboard, Smartphone, RefreshCw, AlertTriangle, TrendingUp, ShoppingBag, FileText, Upload, Edit3, Info, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
// import './App.css'; // Removed in favor of Tailwind CSS

function ShortcutsHelp({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{t('keyboard_shortcuts_title')}</h2>
          <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">{t('f2_label')}</kbd>
            <span className="text-sm text-gray-700">{t('focus_search')}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span>
              <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">{t('f12_label')}</kbd> / <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">Ctrl</kbd> + <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">Enter</kbd>
            </span>
            <span className="text-sm text-gray-700">{t('checkout_shortcut')}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">{t('escape_label')}</kbd>
            <span className="text-sm text-gray-700">{t('close_modal_shortcut')}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span><kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">Alt</kbd> + <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">C</kbd></span>
            <span className="text-sm text-gray-700">{t('clear_cart_shortcut')}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span><kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">Alt</kbd> + <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">P</kbd></span>
            <span className="text-sm text-gray-700">{t('print_receipt_shortcut')}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span><kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">Alt</kbd> + <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">N</kbd></span>
            <span className="text-sm text-gray-700">{t('new_sale_shortcut')}</span>
          </div>
           <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
            <span><kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">Alt</kbd> + <kbd className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">H</kbd></span>
            <span className="text-sm text-gray-700">{t('show_shortcuts_shortcut')}</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function ActivationView({ onActivate, isExpired }) {
  const { t } = useTranslation();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 ring-1 ring-slate-900/5">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg transform rotate-3 ${isExpired ? "bg-red-500 shadow-red-500/30" : "bg-gradient-to-tr from-green-500 to-emerald-400 shadow-green-500/30"}`}>
            <Key size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{isExpired ? t('license_expired') : t('product_activation')}</h2>
          <p className="text-slate-600">{isExpired ? t('license_expired_msg') : t('enter_product_key')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('product_key_label')}</label>
            <input 
              type="text" 
              value={key} 
              onChange={e => setKey(e.target.value.toUpperCase())} 
              placeholder="FNF-PRO-XXXX-XXXX"
              required 
              autoFocus
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 focus:bg-white text-center font-mono tracking-widest text-lg"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2 justify-center"><AlertTriangle size={16}/>{error}</p>}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? t('verifying') : (isExpired ? <><RefreshCw size={18}/> {t('renew_license')}</> : <><CheckCircle size={18}/> {t('activate_software')}</>)}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-500 space-y-1">
          <p>{t('need_key')}</p>
          <p className="font-medium text-blue-600">www.fnfgc.com</p>
        </div>
      </div>
    </div>
  );
}

// --- Login Component ---
function Login({ onLogin, onSignup }) {
  const { t } = useTranslation();
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
        setError(t('invalid_credentials'));
      }
    } catch (err) {
      console.error(err);
      setError(t('login_failed'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 ring-1 ring-slate-900/5">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold shadow-lg shadow-blue-500/30 transform rotate-3">FNF</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('pos_system_login')}</h2>
          <p className="text-slate-600">{t('enter_credentials')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email_username')}</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="user@business.com"
              required 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 focus:bg-white"
            />
          </div>
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95">
            <Lock size={18} />
            {t('login')}
          </button>
        </form>
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-slate-500">{t('powered_by')}</p>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline bg-transparent border-none cursor-pointer" onClick={onSignup}>
            {t('create_new_account')}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { t, i18n } = useTranslation();
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
  
  // Handle language direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  
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
      // Extract detailed error from fallback server if available
      const detailedError = err.response?.data?.details || err.response?.data?.error;
      
      // Debug info if detailed error is missing but response exists
      let debugInfo = '';
      if (!detailedError && err.response?.data) {
          try {
             debugInfo = typeof err.response.data === 'string' ? err.response.data.substring(0, 200) : JSON.stringify(err.response.data);
          } catch { debugInfo = 'Parse Error'; }
      }

      setConnectionError(detailedError || (err.message + (debugInfo ? ` | Response: ${debugInfo}` : '')) || "Failed to connect to server");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
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
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Restore view preference or default to dashboard for accountants/owners
        if (parsedUser.role === 'admin' || parsedUser.role === 'accountant' || parsedUser.role === 'owner') {
             setView('dashboard');
        }
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
    
    // Set default view based on role
    if (userData.role === 'admin' || userData.role === 'accountant' || userData.role === 'owner') {
      setView('dashboard');
    } else {
      setView('pos');
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 px-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50 ring-1 ring-slate-900/5 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-red-500/30">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('connection_failed')}</h2>
          <p className="text-slate-600">{connectionError}</p>
          <p className="text-sm text-slate-500 mt-2">{t('check_server_port')}</p>
          <button 
            onClick={() => { setConnectionError(null); checkActivation(); }} 
            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {t('retry_connection')}
          </button>
        </div>
      </div>
    );
  }

  if (isActivated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw size={20} className="animate-spin" />
          {t('loading_system')}
        </div>
      </div>
    );
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



  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      {isReceiptOpen && invoiceData && (
        <ReceiptView 
          data={invoiceData} 
          settings={settings}
          onClose={() => setIsReceiptOpen(false)} 
        />
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm sm:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">FNF Group POS</h1>
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">{user.role}</span>
          </div>
          <button className="block p-1 text-slate-600 sm:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <div className={`fixed inset-0 z-30 flex flex-col bg-white p-4 transition-transform duration-300 sm:static sm:flex sm:flex-row sm:items-center sm:gap-2 sm:bg-transparent sm:p-0 sm:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <div className="mb-6 sm:hidden">
             <div className="text-lg font-bold text-slate-900">{t('welcome')}, {user.name}</div>
             <div className="text-xs text-slate-500">FNF Group | v1.0.0</div>
          </div>
          <button 
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'pos' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            onClick={() => handleViewChange('pos')}
          >
            <ShoppingCart size={18} /> {t('pos') || 'POS'}
          </button>
          
          {(user.role === 'admin' || user.role === 'stock_manager' || user.role === 'owner') && (
            <>
              <button 
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'inventory' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                onClick={() => handleViewChange('inventory')}
              >
                <Package size={18} /> {t('product_inventory')}
              </button>
              <button 
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                onClick={() => handleViewChange('dashboard')}
              >
                <LayoutDashboard size={18} /> {t('dashboard')}
              </button>
              {(user.role === 'owner' || user.role === 'admin' || user.role === 'accountant') && (
                <>
                  <button 
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'customers' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    onClick={() => handleViewChange('customers')}
                  >
                    <Users size={18} /> {t('customers') || 'Customers'}
                  </button>
                  <button 
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'vendors' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    onClick={() => handleViewChange('vendors')}
                  >
                    <Users size={18} /> {t('vendors') || 'Vendors'}
                  </button>
                  <button 
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'reports' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    onClick={() => handleViewChange('reports')}
                  >
                    <FileText size={18} /> {t('reports') || 'Reports'}
                  </button>
                  <button 
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'accounting' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                    onClick={() => handleViewChange('accounting')}
                  >
                    <TrendingUp size={18} /> {t('accounting') || 'Accounting'}
                  </button>
                </>
              )}
            </>
          )}

          {(user.role === 'owner' || user.role === 'admin') && (
            <>
              <button 
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'users' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                onClick={() => handleViewChange('users')}
              >
                <Users size={18} /> {t('user_management')}
              </button>
              <button 
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                onClick={() => handleViewChange('settings')}
              >
                <Settings size={18} /> {t('system_settings')}
              </button>
            </>
          )}

{/* Reports button moved */}
          
          <button 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (Alt+H)"
          >
            <Keyboard size={18} /> {t('keyboard_shortcuts')}
          </button>

          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 sm:ml-4" onClick={handleLogout}>
            <LogOut size={18} /> {t('logout')}
          </button>
        </div>
        
        <div className="hidden text-right sm:block">
           <div className="text-sm font-semibold text-slate-900">{t('welcome')}, {user.name}</div>
           <div className="text-xs text-slate-500">FNF Group | v1.0.0</div>
        </div>
      </header>

      {view === 'pos' && (
        <div className="flex h-full flex-col overflow-hidden sm:flex-row">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b bg-white px-6 py-4">
               <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products (F2)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 bg-slate-50/50">
              {products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock < 5;
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-blue-500/20 border border-slate-100 ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''} ${isLowStock ? 'border-amber-200 bg-amber-50/30' : ''}`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <div className="h-32 w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                        <span className="text-4xl font-black text-blue-200/50 select-none transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                          {(product.name || '??').substring(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex h-full flex-col p-4">
                        <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1 leading-tight min-h-[1.25rem]">
                          {product.name || 'Unnamed Product'}
                        </h3>
                        <p className="text-lg font-bold text-blue-600">PKR {Number(product.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        <div className={`mt-auto pt-3 text-xs font-medium flex items-center gap-1.5 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-slate-500'}`}>
                           {isOutOfStock ? <AlertTriangle size={14}/> : isLowStock ? <AlertTriangle size={14}/> : <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                          {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
                        </div>
                      </div>
                      {!isOutOfStock && (
                        <div className="absolute right-3 top-3 rounded-full bg-white/90 backdrop-blur shadow-sm p-2 text-blue-600 opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0 hover:bg-blue-600 hover:text-white">
                          <Plus size={20} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex w-full flex-col border-l bg-white sm:w-80 md:w-96 shadow-xl z-10">
            <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold text-slate-900 bg-slate-50/50">
              <ShoppingCart size={20} className="text-blue-600" /> {t('total')}
            </div>
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <ShoppingBag size={48} className="text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">Your cart is empty</p>
                <p className="text-sm mt-1">Add items from the list to start</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-start justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm hover:border-blue-100 transition-colors">
                    <div className="flex-1 mr-2">
                      <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{item.name || 'Unnamed Product'}</h4>
                      <p className="text-sm font-semibold text-blue-600">PKR {Number(item.price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button className="px-2 py-1 hover:bg-white hover:text-blue-600 transition-colors rounded-l-lg" onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button className="px-2 py-1 hover:bg-white hover:text-blue-600 transition-colors rounded-r-lg" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                      </div>
                      <button className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" onClick={() => removeFromCart(item.id)}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="border-t bg-slate-50 p-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal:</span>
                  <span>PKR {calculateTotal().subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{t('gst_amount')}</span>
                  <span>PKR {calculateTotal().tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total:</span>
                  <span>PKR {calculateTotal().total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <button 
                  className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:bg-blue-700 active:translate-y-0 active:shadow-none flex items-center justify-center gap-2" 
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  <CheckCircle size={20} />
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'inventory' && <InventoryView products={products} onUpdate={fetchProducts} user={user} />}
      {view === 'dashboard' && <DashboardView user={user} onNavigate={setView} />}
      {view === 'users' && <UserManagementView user={user} />}
      {view === 'settings' && <SettingsView settings={settings} onUpdate={fetchSettings} user={user} />}
      {view === 'reports' && <ReportsView />}
      {view === 'accounting' && <AccountingView />}
      {view === 'customers' && <PartnersView type="customer" />}
      {view === 'vendors' && <PartnersView type="vendor" />}

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <ShortcutsHelp onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
                <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setIsCheckoutOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCheckout} className="p-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      value={buyerInfo.name} 
                      onChange={e => setBuyerInfo({...buyerInfo, name: e.target.value})}
                      required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNIC (99999-9999999-9)</label>
                    <input 
                      value={buyerInfo.cnic} 
                      onChange={e => setBuyerInfo({...buyerInfo, cnic: e.target.value})}
                      required 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                    <input 
                      value={buyerInfo.phone} 
                      onChange={e => setBuyerInfo({...buyerInfo, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="mt-8 flex gap-3 justify-end">
                  <button type="button" className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsCheckoutOpen(false)}>Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryView({ products, onUpdate, user }) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const closeModal = () => {
    setIsAdding(false);
    setIsEditing(false);
    setFormData({ name: '', price: '', stock: '', pctCode: '', taxRate: 17 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedProduct) {
        await api.put(`/api/products/${selectedProduct.id}`, {
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          pctCode: formData.pctCode,
          taxRate: parseFloat(formData.taxRate)
        });
      } else {
        await api.post('/api/products', {
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          pctCode: formData.pctCode,
          taxRate: parseFloat(formData.taxRate)
        });
      }
      closeModal();
      onUpdate();
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Failed to save product: " + (err.response?.data?.error || err.message));
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
        name: product.name,
        price: product.price,
        stock: product.stock,
        pctCode: product.pctCode || '',
        taxRate: product.taxRate || 17
    });
    setIsEditing(true);
    setIsAdding(true);
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
        
        // Robust CSV splitting: handle quoted commas
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const product = {};
        
        headers.forEach((header, index) => {
           // Basic mapping
           let key = header.toLowerCase().replace(/[\s_]+/g, '');
           if (key === 'name' || key === 'productname') key = 'name';
           else if (key === 'price' || key === 'retailprice') key = 'price';
           else if (key === 'stock' || key === 'quantity' || key === 'qty') key = 'stock';
           else if (key === 'balanceqty') key = 'balance_qty'; // Special handling
           else if (key === 'pctcode' || key === 'pct') key = 'pctCode';
           else if (key === 'tax' || key === 'taxrate') key = 'taxRate';
           
           if (values[index] !== undefined) {
            const raw = values[index].trim().replace(/^"|"$/g, '');
            product[header] = raw; // Keep original key for server too
             // Also store mapped key for easier server handling if we want to standardize here
            if (key === 'name') product.name = raw;
            if (key === 'price') product.price = raw;
            if (key === 'stock') product.quantity = raw;
            if (key === 'balance_qty') product.balance_qty = raw;
            if (key === 'pctCode') product.pctCode = raw;
            if (key === 'taxRate') product.taxRate = raw;
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
        console.error("Failed to delete product", err);
        alert("Failed to delete product: " + (err.response?.data?.error || err.message));
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
      console.error("Failed to update stock", err);
      alert("Failed to update stock: " + (err.response?.data?.error || err.message));
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockUpdateQty('');
    setIsUpdatingStock(true);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-8 overflow-y-auto flex-1">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{t('product_inventory')}</h2>
        {(user.role === 'owner' || user.role === 'admin') && (
          <div className="flex gap-3">
             <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setIsImporting(true)}>
              <Package size={18} /> {t('import_csv')}
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm" onClick={() => setIsAdding(true)}>
              <Plus size={18} /> {t('add_product')}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_name_header')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_price_header')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_stock_header')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_pct_header')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_tax_header')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('product_actions_header')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-700 font-semibold">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">PKR {Number(p.price || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${p.stock < 5 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono bg-slate-50/50 rounded-lg">{p.pctCode}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.taxRate}%</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 transition-all active:scale-95" 
                        title="Add Stock"
                        onClick={() => openStockModal(p)}
                      >
                        <Plus size={18} />
                      </button>
                      {(user.role === 'admin' || user.role === 'owner') && (
                        <>
                          <button 
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all active:scale-95" 
                            title="Edit Product"
                            onClick={() => openEditModal(p)}
                          >
                            <Edit3 size={18} />
                          </button>
                          <button className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95" onClick={() => handleDelete(p.id)}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isImporting && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">{t('import_products_title')}</h2>
                <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setIsImporting(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleImport} className="p-6">
                <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('select_file')}</label>
                  <input 
                    type="file" 
                    accept=".csv"
                    required 
                    onChange={e => setImportFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                  />
                  <small className="block mt-2 text-xs text-slate-500">
                    {t('expected_columns')}
                  </small>
                </div>
                
                {importStatus && (
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                    {importStatus}
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button type="button" className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsImporting(false)}>{t('cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50" disabled={!importFile}>{t('import_now')}</button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{isEditing ? t('edit_product') : t('add_new_product')}</h2>
              <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('table_name')}</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table_price')}</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table_stock')}</label>
                    <input type="number" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table_pct')}</label>
                    <input required value={formData.pctCode} onChange={e => setFormData({...formData, pctCode: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table_tax')}</label>
                    <input type="number" required value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3 justify-end">
                <button type="button" className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all">{isEditing ? t('update_product') : t('add_product')}</button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {isUpdatingStock && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{t('add_stock')}</h2>
              <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setIsUpdatingStock(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStockUpdate} className="p-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-2">{t('table_name')}: <span className="font-semibold">{selectedProduct?.name}</span></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('quantity_add')}</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    value={stockUpdateQty} 
                    onChange={e => setStockUpdateQty(e.target.value)} 
                    placeholder={t('enter_qty')}
                    autoFocus
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button type="button" className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsUpdatingStock(false)}>{t('cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all">{t('update_stock_btn')}</button>
              </div>
            </form>
          </div>
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
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static print:block">
      <div className="flex min-h-full items-center justify-center p-4 print:p-0">
        <div className="relative w-full max-w-[380px] bg-white p-6 shadow-2xl rounded-xl print:shadow-none print:w-full print:max-w-full print:p-0 mx-auto">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 print:hidden" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">{settings.business_name || 'Business Name'}</h2>
          <p className="text-sm text-slate-600">{settings.business_address || 'Business Address'}</p>
          <p className="text-sm text-slate-600">Contact: {settings.business_contact || 'N/A'}</p>
          <p className="text-sm text-slate-600">NTN: {settings.business_ntn || '0000000-0'}</p>
          <p className="text-sm text-slate-600">STRN: {settings.business_strn || '0000000000000'}</p>
          <p className="text-sm text-slate-600">POS ID: {settings.pos_id || "null"}</p>
        </div>
        
        <div className="mb-4 space-y-1 text-sm text-slate-600 border-b border-dashed border-slate-300 pb-4">
          <p className="flex justify-between"><strong>Invoice #:</strong> <span>{data.InvoiceNumber}</span></p>
          <div className="my-2 border border-slate-200 bg-slate-50 p-2 text-center rounded">
            <p className="text-xs text-slate-500">FBR Invoice #</p>
            <p className="font-mono font-bold text-slate-900">{data.fbrInvoiceId || data.InvoiceNumber}</p>
          </div>
          <p className="flex justify-between"><strong>Date:</strong> <span>{invoiceDate}</span></p>
          <p className="flex justify-between"><strong>Customer:</strong> <span>{data.buyerInfo.name}</span></p>
          {data.buyerInfo.cnic !== "99999-9999999-9" && <p className="flex justify-between"><strong>CNIC:</strong> <span>{data.buyerInfo.cnic}</span></p>}
        </div>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-dashed border-slate-200 last:border-0">
                <td className="py-1">{item.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">{item.price}</td>
                <td className="text-right py-1">{Number(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-dashed border-slate-300 pt-4 mb-6 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{Number(data.totals.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Tax:</span>
            <span>{Number(data.totals.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300 mt-2">
            <span>Total:</span>
            <span>{Number(data.totals.total).toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex flex-col items-center justify-center p-4 bg-white">
            <QRCodeSVG value={data.fbrInvoiceId || data.InvoiceNumber || "N/A"} size={100} level="M" />
            <p className="mt-2 text-xs text-slate-500 uppercase tracking-wide">Verify with FBR</p>
          </div>
          <p className="text-sm font-medium text-slate-900">Thank you for your business!</p>
          <p className="text-xs text-slate-400">FNF Group - fnfgc.com - 03020010222</p>
        </div>

        <div className="flex gap-3 mt-6 print:hidden">
          <button className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-900 transition-colors" onClick={printReceipt}><Printer size={16}/> Print</button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={onClose}><CheckCircle size={16}/> New Sale</button>
        </div>
      </div>
      </div>
    </div>
  );
}

function AccountingView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('receivables');
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentType, setCurrentType] = useState('receivable');
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState({
    partnerId: '',
    partyName: '',
    refNumber: '',
    date: '',
    dueDate: '',
    amount: '',
    description: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: '',
    description: ''
  });
  const [receivableReport, setReceivableReport] = useState(null);
  const [payableReport, setPayableReport] = useState(null);
  const [paymentReport, setPaymentReport] = useState([]);
  const [customerPartners, setCustomerPartners] = useState([]);
  const [vendorPartners, setVendorPartners] = useState([]);

  const loadReceivables = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/accounting/receivables');
      setReceivables(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load receivables');
    } finally {
      setLoading(false);
    }
  };

  const loadPayables = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/accounting/payables');
      setPayables(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payables');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const [arRes, apRes, payRes] = await Promise.all([
        api.get('/api/reports/receivables'),
        api.get('/api/reports/payables'),
        api.get('/api/reports/payments', { params: { type: 'all' } })
      ]);
      setReceivableReport(arRes.data || null);
      setPayableReport(apRes.data || null);
      setPaymentReport(payRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadPartners = async () => {
    try {
      const [customersRes, vendorsRes] = await Promise.all([
        api.get('/api/partners', { params: { type: 'customer' } }),
        api.get('/api/partners', { params: { type: 'vendor' } })
      ]);
      setCustomerPartners(customersRes.data || []);
      setVendorPartners(vendorsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load partners');
    }
  };

  useEffect(() => {
    if (tab === 'receivables') {
      loadReceivables();
    } else if (tab === 'payables') {
      loadPayables();
    } else if (tab === 'reports') {
      loadReports();
    }
  }, [tab]);

  useEffect(() => {
    loadPartners();
  }, []);

  const openNewInvoice = () => {
    setForm({
      partnerId: '',
      partyName: '',
      refNumber: '',
      date: '',
      dueDate: '',
      amount: '',
      description: ''
    });
    setShowInvoiceModal(true);
  };

  const openNewBill = () => {
    setForm({
      partnerId: '',
      partyName: '',
      refNumber: '',
      date: '',
      dueDate: '',
      amount: '',
      description: ''
    });
    setShowBillModal(true);
  };

  const openPayment = (row, type) => {
    setSelectedRow(row);
    setCurrentType(type);
    setPaymentForm({
      amount: '',
      date: '',
      description: ''
    });
    setShowPaymentModal(true);
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/accounting/receivables', {
        partnerId: form.partnerId || undefined,
        partyName: form.partyName,
        refNumber: form.refNumber,
        date: form.date || undefined,
        dueDate: form.dueDate || undefined,
        amount: form.amount,
        description: form.description
      });
      setShowInvoiceModal(false);
      await loadReceivables();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/accounting/payables', {
        partnerId: form.partnerId || undefined,
        partyName: form.partyName,
        refNumber: form.refNumber,
        date: form.date || undefined,
        dueDate: form.dueDate || undefined,
        amount: form.amount,
        description: form.description
      });
      setShowBillModal(false);
      await loadPayables();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRow) return;
    setLoading(true);
    setError('');
    try {
      if (currentType === 'receivable') {
        await api.post(`/api/accounting/receivables/${selectedRow.id}/receipt`, {
          amount: paymentForm.amount,
          date: paymentForm.date || undefined,
          description: paymentForm.description
        });
        await loadReceivables();
      } else {
        await api.post(`/api/accounting/payables/${selectedRow.id}/payment`, {
          amount: paymentForm.amount,
          date: paymentForm.date || undefined,
          description: paymentForm.description
        });
        await loadPayables();
      }
      setShowPaymentModal(false);
      setSelectedRow(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('accounting') || 'Accounting'}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'receivables' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setTab('receivables')}
            >
              {t('receivables') || 'Receivables'}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'payables' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setTab('payables')}
            >
              {t('payables') || 'Payables'}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'reports' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              onClick={() => setTab('reports')}
            >
              {t('aging_report') || 'Reports'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2 text-sm">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {tab === 'receivables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{t('receivable_invoices') || 'Customer Invoices (Receivable)'}</h3>
                <button
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                  onClick={openNewInvoice}
                >
                  <Plus size={18} />
                  {t('new_invoice') || 'New Invoice'}
                </button>
              </div>
              <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('invoice_no') || 'Invoice #'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('customer') || 'Customer'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('date') || 'Date'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('due_date') || 'Due Date'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('total_amount') || 'Amount'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('outstanding') || 'Outstanding'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('status') || 'Status'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receivables.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-6 text-center text-sm text-slate-400">
                            {loading ? 'Loading...' : t('no_data') || 'No invoices yet'}
                          </td>
                        </tr>
                      ) : (
                        receivables.map(row => (
                          <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-3 text-sm font-mono text-slate-700">{row.refNumber}</td>
                            <td className="px-6 py-3 text-sm text-slate-700">{row.partyName}</td>
                            <td className="px-6 py-3 text-sm text-slate-600">{row.date ? new Date(row.date).toLocaleDateString() : ''}</td>
                            <td className="px-6 py-3 text-sm text-slate-600">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-3 text-sm text-right font-medium text-slate-700">
                              PKR {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-medium">
                              <span className={row.outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                PKR {Number(row.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  row.status === 'closed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : row.status === 'partial'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    row.status === 'closed'
                                      ? 'bg-emerald-500'
                                      : row.status === 'partial'
                                      ? 'bg-amber-500'
                                      : 'bg-blue-500'
                                  }`}
                                ></div>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-right">
                              {row.outstanding > 0 && (
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                                  onClick={() => openPayment(row, 'receivable')}
                                >
                                  <CheckCircle size={14} />
                                  {t('add_receipt') || 'Add Receipt'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'payables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{t('vendor_bills') || 'Vendor Bills (Payable)'}</h3>
                <button
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                  onClick={openNewBill}
                >
                  <Plus size={18} />
                  {t('new_bill') || 'New Bill'}
                </button>
              </div>
              <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('bill_no') || 'Bill #'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('vendor') || 'Vendor'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('date') || 'Date'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('due_date') || 'Due Date'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('total_amount') || 'Amount'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('outstanding') || 'Outstanding'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('status') || 'Status'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payables.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-6 text-center text-sm text-slate-400">
                            {loading ? 'Loading...' : t('no_data') || 'No bills yet'}
                          </td>
                        </tr>
                      ) : (
                        payables.map(row => (
                          <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-3 text-sm font-mono text-slate-700">{row.refNumber}</td>
                            <td className="px-6 py-3 text-sm text-slate-700">{row.partyName}</td>
                            <td className="px-6 py-3 text-sm text-slate-600">{row.date ? new Date(row.date).toLocaleDateString() : ''}</td>
                            <td className="px-6 py-3 text-sm text-slate-600">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</td>
                            <td className="px-6 py-3 text-sm text-right font-medium text-slate-700">
                              PKR {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-medium">
                              <span className={row.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                PKR {Number(row.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  row.status === 'closed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : row.status === 'partial'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    row.status === 'closed'
                                      ? 'bg-emerald-500'
                                      : row.status === 'partial'
                                      ? 'bg-amber-500'
                                      : 'bg-red-500'
                                  }`}
                                ></div>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-right">
                              {row.outstanding > 0 && (
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                                  onClick={() => openPayment(row, 'payable')}
                                >
                                  <CheckCircle size={14} />
                                  {t('add_payment') || 'Add Payment'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('receivable_summary') || 'Receivable Summary'}</h3>
                  {receivableReport ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="flex justify-between">
                        <span>{t('total_receivable') || 'Total Receivable'}</span>
                        <span className="font-semibold">
                          PKR {Number(receivableReport.totalReceivable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t('total_outstanding') || 'Total Outstanding'}</span>
                        <span className="font-semibold text-amber-700">
                          PKR {Number(receivableReport.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t('total_overdue') || 'Total Overdue'}</span>
                        <span className="font-semibold text-red-700">
                          PKR {Number(receivableReport.totalOverdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      {receivableReport.aging && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">{t('aging_breakdown') || 'Aging Breakdown'}</p>
                          <div className="space-y-1 text-xs">
                            <p className="flex justify-between">
                              <span>{t('aging_current') || 'Current'}</span>
                              <span>
                                PKR {Number(receivableReport.aging.current || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_1_30') || '1-30 days'}</span>
                              <span>
                                PKR {Number(receivableReport.aging.days_1_30 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_31_60') || '31-60 days'}</span>
                              <span>
                                PKR {Number(receivableReport.aging.days_31_60 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_61_90') || '61-90 days'}</span>
                              <span>
                                PKR {Number(receivableReport.aging.days_61_90 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_90_plus') || '90+ days'}</span>
                              <span>
                                PKR {Number(receivableReport.aging.days_90_plus || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">{loading ? 'Loading...' : t('no_data') || 'No data'}</p>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('payable_summary') || 'Payable Summary'}</h3>
                  {payableReport ? (
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="flex justify-between">
                        <span>{t('total_payable') || 'Total Payable'}</span>
                        <span className="font-semibold">
                          PKR {Number(payableReport.totalPayable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t('total_outstanding') || 'Total Outstanding'}</span>
                        <span className="font-semibold text-red-700">
                          PKR {Number(payableReport.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t('total_overdue') || 'Total Overdue'}</span>
                        <span className="font-semibold text-red-700">
                          PKR {Number(payableReport.totalOverdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      {payableReport.aging && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">{t('aging_breakdown') || 'Aging Breakdown'}</p>
                          <div className="space-y-1 text-xs">
                            <p className="flex justify-between">
                              <span>{t('aging_current') || 'Current'}</span>
                              <span>
                                PKR {Number(payableReport.aging.current || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_1_30') || '1-30 days'}</span>
                              <span>
                                PKR {Number(payableReport.aging.days_1_30 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_31_60') || '31-60 days'}</span>
                              <span>
                                PKR {Number(payableReport.aging.days_31_60 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_61_90') || '61-90 days'}</span>
                              <span>
                                PKR {Number(payableReport.aging.days_61_90 || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span>{t('aging_90_plus') || '90+ days'}</span>
                              <span>
                                PKR {Number(payableReport.aging.days_90_plus || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">{loading ? 'Loading...' : t('no_data') || 'No data'}</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{t('payment_history') || 'Payment & Receipt History'}</h3>
                  <span className="text-xs text-slate-500">
                    {t('showing_last_n', { count: 500 }) || 'Showing last 500 records'}
                  </span>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('date') || 'Date'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('type') || 'Type'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('invoice_no') || 'Ref #'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('party') || 'Party'}</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('amount') || 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentReport.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-400">
                            {loading ? 'Loading...' : t('no_data') || 'No payments yet'}
                          </td>
                        </tr>
                      ) : (
                        paymentReport.map(row => (
                          <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-3 text-sm text-slate-600">{row.date ? new Date(row.date).toLocaleString() : ''}</td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  row.type === 'receipt'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {row.type === 'receipt' ? (t('receipt') || 'Receipt') : (t('payment') || 'Payment')}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm font-mono text-slate-700">{row.refNumber}</td>
                            <td className="px-6 py-3 text-sm text-slate-700">{row.partyName}</td>
                            <td className="px-6 py-3 text-sm text-right font-medium text-slate-700">
                              PKR {Number(row.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(showInvoiceModal || showBillModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => { setShowInvoiceModal(false); setShowBillModal(false); }}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  {showInvoiceModal ? (t('new_invoice') || 'New Invoice') : (t('new_bill') || 'New Bill')}
                </h2>
                <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={() => { setShowInvoiceModal(false); setShowBillModal(false); }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={showInvoiceModal ? handleInvoiceSubmit : handleBillSubmit} className="p-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {showInvoiceModal ? (t('customer') || 'Customer') : (t('vendor') || 'Vendor')}
                    </label>
                    <select
                      value={form.partnerId}
                      onChange={e => {
                        const value = e.target.value;
                        const list = showInvoiceModal ? customerPartners : vendorPartners;
                        const selected = list.find(p => String(p.id) === value);
                        setForm({
                          ...form,
                          partnerId: value,
                          partyName: selected ? selected.name : form.partyName
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-2 bg-white"
                    >
                      <option value="">{showInvoiceModal ? 'Select customer' : 'Select vendor'}</option>
                      {(showInvoiceModal ? customerPartners : vendorPartners).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      value={form.partyName}
                      onChange={e => setForm({ ...form, partyName: e.target.value })}
                      placeholder={showInvoiceModal ? 'Customer name' : 'Vendor name'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('date') || 'Date'}</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('due_date') || 'Due Date'}</label>
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={e => setForm({ ...form, dueDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('reference_no') || 'Reference #'}</label>
                    <input
                      value={form.refNumber}
                      onChange={e => setForm({ ...form, refNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {t('leave_blank_auto') || 'Leave blank to auto-generate'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount') || 'Amount'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('description') || 'Description'}</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => { setShowInvoiceModal(false); setShowBillModal(false); }}
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedRow && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => { setShowPaymentModal(false); setSelectedRow(null); }}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  {currentType === 'receivable' ? (t('add_receipt') || 'Add Receipt') : (t('add_payment') || 'Add Payment')}
                </h2>
                <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={() => { setShowPaymentModal(false); setSelectedRow(null); }}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="p-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <p className="text-sm text-slate-600">
                      {selectedRow.partyName} • {selectedRow.refNumber}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('outstanding') || 'Outstanding'}:{' '}
                      <span className="font-semibold">
                        PKR {Number(selectedRow.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('date') || 'Date'}</label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount') || 'Amount'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('description') || 'Description'}</label>
                    <textarea
                      value={paymentForm.description}
                      onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => { setShowPaymentModal(false); setSelectedRow(null); }}
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function DashboardView({ user, onNavigate }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ revenue: 0, orders: 0, lowStockCount: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/dashboard');
      setStats(res.data.stats || { revenue: 0, orders: 0, lowStockCount: 0 });
      setLowStock(res.data.lowStockItems || []);
      setRecentTx(res.data.recentTransactions || []);
      setConnectionInfo(res.data.connectionInfo || null);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError(t('dashboard_error') || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !stats.revenue && !error) return <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2" /> {t('loading_dashboard')}...</div>;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-8 overflow-y-auto flex-1">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{t('business_dashboard')}</h2>
        <div className="flex gap-2">
          {error && <span className="text-red-500 text-sm flex items-center px-3 bg-red-50 rounded-lg border border-red-100">{error}</span>}
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> {t('refresh_data')}
          </button>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 group">
             <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <TrendingUp size={24} />
             </div>
            <span className="text-sm font-medium text-slate-500">{t('total_revenue')}</span>
            <span className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">PKR {Number(stats.revenue).toLocaleString()}</span>
          </div>
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 group">
             <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingBag size={24} />
             </div>
            <span className="text-sm font-medium text-slate-500">{t('total_orders')}</span>
            <span className="mt-1 text-2xl font-bold text-slate-900 tracking-tight">{stats.orders}</span>
          </div>
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 group">
             <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <AlertTriangle size={24} />
             </div>
            <span className="text-sm font-medium text-slate-500">{t('low_stock_items')}</span>
            <span className={`mt-1 text-2xl font-bold tracking-tight ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-slate-900'}`}>
              {stats.lowStockCount}
            </span>
          </div>

          {(user?.role === 'owner' || user?.role === 'admin') && (
            <div 
              className="flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 group cursor-pointer"
              onClick={() => onNavigate('reports')}
            >
               <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
               </div>
              <span className="text-sm font-medium text-slate-500">{t('reports') || 'Reports'}</span>
              <div className="mt-1 flex items-center gap-2 text-slate-900 font-bold">
                 <span>View Transactions</span>
                 <ArrowRight size={20} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          )}
        </div>
      )}

      {connectionInfo && (
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 mb-8">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
             <Smartphone size={24} className="text-amber-500" />
             {t('mobile_access')}
          </h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {connectionInfo.publicUrl && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <QRCodeSVG value={connectionInfo.publicUrl} size={128} />
                <p className="mt-4 font-medium text-slate-900">{t('any_wifi')}</p>
                <code className="mt-2 rounded bg-slate-200 px-2 py-1 font-mono text-sm font-bold text-slate-700">{connectionInfo.publicUrl}</code>
              </div>
            )}
            
            {connectionInfo.localIps.map(ip => (
               <div key={ip} className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <QRCodeSVG value={ip} size={128} />
                <p className="mt-4 font-medium text-green-600">{t('local_wifi')}</p>
                <code className="mt-2 rounded bg-slate-200 px-2 py-1 font-mono text-sm font-bold text-slate-700">{ip}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
            <h3 className="text-lg font-bold text-slate-900">{t('recent_transactions')}</h3>
          </div>
          {recentTx.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic flex flex-col items-center gap-2">
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
                 <RefreshCw size={24} />
               </div>
               <p>{t('no_transactions')}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[400px] text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('invoice_no')}</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('date')}</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('total_amount')}</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTx.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-700 font-mono font-medium">{tx.invoiceNumber || 'N/A'}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{!isNaN(new Date(tx.date).getTime()) ? new Date(tx.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-slate-700">PKR {tx.totalAmount ? Number(tx.totalAmount).toFixed(2) : '0.00'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          {t('status_reported')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-red-50/30 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               <AlertTriangle size={20} className="text-red-500" /> 
               {t('low_stock_alerts')}
             </h3>
             {lowStock.length > 0 && <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{lowStock.length} Items</span>}
          </div>
          {lowStock.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic flex flex-col items-center gap-2">
               <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-2">
                 <CheckCircle size={24} />
               </div>
               <p className="text-green-600 font-medium">{t('all_stocked')}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[400px] text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('products')}</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('table_stock')}</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('table_price')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStock.map(item => (
                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">
                      <td className="px-6 py-3 text-sm text-slate-700 font-medium">{item.name}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-md">
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">PKR {item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserManagementView({ user }) {
  const { t } = useTranslation();
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
      console.error("Failed to fetch users", err);
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
    if (confirm(t('delete_user_confirm') || 'Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-8 overflow-y-auto flex-1">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{t('user_management')}</h2>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> {t('add_user')}
        </button>
      </div>

      <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('table_name')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('username')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{t('role')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-700 font-semibold">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono bg-slate-50/50 rounded-lg inline-block my-2 mx-6 w-fit px-2 py-0.5">{u.username}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${u.role === 'admin' || u.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.role === 'admin' || u.role === 'owner' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all active:scale-95" 
                        onClick={() => handleEdit(u)}
                        title={t('edit_user')}
                      >
                        <Edit3 size={18} /> 
                      </button>
                      <button 
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-95" 
                        onClick={() => handleDelete(u.id)}
                        title={t('delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-2">
                       <Users size={48} className="text-slate-200" />
                       <p>{t('no_users_found')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">{editingUser ? t('edit_user') : t('add_new_user')}</h2>
              <button className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-full shadow-sm hover:shadow-md" onClick={closeModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
                    <AlertTriangle size={16} />
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('full_name')}</label>
                  <input 
                    type="text"
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('username_login_id')}</label>
                  <input 
                    type="text"
                    required 
                    disabled={!!editingUser} // Disable username edit
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    placeholder="e.g. john_cashier"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {!editingUser && <small className="block mt-1.5 text-xs text-slate-500 flex items-center gap-1"><Info size={12} /> {t('must_be_unique')}</small>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{editingUser ? t('new_password_optional') : t('password')}</label>
                  <input 
                    type="password"
                    required={!editingUser} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? t('leave_blank_keep_current') : "••••••••"}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('role')}</label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.role === 'cashier' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="cashier" 
                        checked={formData.role === 'cashier'} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{t('cashier_role')}</span>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.role === 'stock_manager' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="role" 
                        value="stock_manager" 
                        checked={formData.role === 'stock_manager'} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{t('stock_manager_role')}</span>
                    </label>
                    
                    {(user?.role === 'admin' || user?.role === 'accountant' || user?.role === 'owner') && (
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.role === 'admin' || formData.role === 'accountant' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name="role" 
                          value="accountant" 
                          checked={formData.role === 'accountant'} 
                          onChange={e => setFormData({...formData, role: e.target.value})}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{t('admin_role')}</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end pt-6 border-t border-slate-100">
                <button type="button" className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors" onClick={closeModal}>{t('cancel')}</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('saving')}</>
                  ) : (
                    <>{editingUser ? t('update_user') : t('create_user')}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ settings, onUpdate, user }) {
  const [activeView, setActiveView] = useState('general');
  const [formData, setFormData] = useState({
    business_name: settings.business_name || '',
    business_address: settings.business_address || '',
    business_contact: settings.business_contact || '',
    business_ntn: settings.business_ntn || '',
    business_strn: settings.business_strn || '',
    pos_id: settings.pos_id || ''
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
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

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPassMsg('New passwords do not match');
        return;
    }
    setPassLoading(true);
    setPassMsg('');
    try {
        await api.post('/api/profile/password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });
        setPassMsg('Password updated successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
        setPassMsg('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
        setPassLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/settings', formData);
      setMsg('Settings updated successfully!');
      onUpdate();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error("Failed to update settings", err);
      setMsg('Failed to update settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImportSales = async (e) => {
      e.preventDefault();
      if (!importFile) return;

      setIsImporting(true);
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
            setIsImporting(false);
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
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(importFile);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-8 overflow-y-auto flex-1">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500 mt-1">Manage your business configuration and data.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-2">
          <button 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'general' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
            onClick={() => setActiveView('general')}
          >
            <Settings size={20} /> General Settings
          </button>
          <button 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'import' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
            onClick={() => setActiveView('import')}
          >
            <RefreshCw size={20} /> Data Import
          </button>
          
          {user?.role === 'owner' && (
            <button 
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
                onClick={() => setActiveView('security')}
            >
                <Lock size={20} /> Security
            </button>
          )}
        </div>

        <div className="flex-1">
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
             {/* Decorative background element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="border-b border-slate-100 pb-6 mb-8">
                   <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                     {activeView === 'general' ? <Settings className="text-blue-500" size={24} /> : activeView === 'import' ? <RefreshCw className="text-blue-500" size={24} /> : <Lock className="text-blue-500" size={24} />}
                     {activeView === 'general' ? 'Business Configuration' : activeView === 'import' ? 'Data Import & Migration' : 'Security Settings'}
                   </h3>
                   <p className="text-slate-500 mt-1 text-sm">
                     {activeView === 'general' ? 'Update your business details and FBR configuration.' : activeView === 'import' ? 'Migrate sales history from other software via CSV.' : 'Manage your password and security preferences.'}
                   </p>
                </div>
                
                <div className="space-y-6">
                  {activeView === 'general' ? (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Business Name</label>
                          <input 
                            value={formData.business_name} 
                            onChange={e => setFormData({...formData, business_name: e.target.value})}
                            placeholder="e.g. FNF Supermarket"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                          <textarea 
                            value={formData.business_address} 
                            onChange={e => setFormData({...formData, business_address: e.target.value})}
                            placeholder="e.g. Shop #1, Main Market, Lahore"
                            rows="3"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                          />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number</label>
                        <input 
                          value={formData.business_contact} 
                          onChange={e => setFormData({...formData, business_contact: e.target.value})}
                          placeholder="e.g. 0300-1234567"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">FBR POS ID</label>
                        <input 
                          value={formData.pos_id} 
                          onChange={e => setFormData({...formData, pos_id: e.target.value})}
                          placeholder="e.g. 123456"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">NTN</label>
                        <input 
                          value={formData.business_ntn} 
                          onChange={e => setFormData({...formData, business_ntn: e.target.value})}
                          placeholder="e.g. 1234567-8"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">STRN</label>
                        <input 
                          value={formData.business_strn} 
                          onChange={e => setFormData({...formData, business_strn: e.target.value})}
                          placeholder="e.g. 1234567890123"
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {msg && (
                      <div className={`p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${msg.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                         {msg.includes('Failed') ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                        {msg}
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-6 border-t border-slate-100">
                      <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-95" disabled={loading}>
                        {loading ? 'Saving Changes...' : 'Save Settings'}
                      </button>
                    </div>
                  </form>
                  ) : activeView === 'import' ? (
                      <div className="max-w-2xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><TrendingUp size={18} /> Migration Guide</h4>
                                <p className="text-blue-800 text-sm leading-relaxed">
                                    Upload a CSV file to import your sales history. This is useful when migrating from another software.
                                    The system will intelligently map columns and create invoices.
                                </p>
                              </div>
                              
                              <div className="mb-6">
                                <p className="text-sm font-semibold text-slate-700 mb-3">Required CSV Columns:</p>
                                <div className="flex flex-wrap gap-2">
                                  <code className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">Invoice No</code>
                                  <code className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">Total</code>
                                </div>
                              </div>
                              
                              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center mb-8 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer relative group bg-slate-50/30">
                                  <input 
                                      type="file" 
                                      accept=".csv"
                                      onChange={e => setImportFile(e.target.files[0])}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <div className="flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                      {importFile ? (
                                          <>
                                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                              <FileText size={32} />
                                            </div>
                                            <span className="text-lg font-medium text-blue-600 break-all px-4">{importFile.name}</span>
                                            <span className="text-sm text-slate-400 mt-1">{(importFile.size / 1024).toFixed(1)} KB</span>
                                          </>
                                      ) : (
                                          <>
                                            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors shadow-sm">
                                              <Upload size={32} />
                                            </div>
                                            <span className="text-lg font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Click to upload CSV</span>
                                            <span className="text-sm text-slate-400 mt-1">or drag and drop file here</span>
                                          </>
                                      )}
                                  </div>
                              </div>

                              <button 
                                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2" 
                                  onClick={handleImportSales}
                                  disabled={!importFile || isImporting}
                              >
                                  {isImporting ? (
                                    <>
                                      <RefreshCw size={20} className="animate-spin" /> Processing Import...
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={20} /> Upload & Import Invoices
                                    </>
                                  )}
                              </button>
                              
                              {importStatus && (
                                  <div className={`mt-6 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${importStatus.includes('failed') || importStatus.includes('No valid') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                      {importStatus.includes('failed') || importStatus.includes('No valid') ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                      <span className="font-medium">{importStatus}</span>
                                  </div>
                              )}
                      </div>
                  ) : (
                      <div className="max-w-xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <form onSubmit={handlePasswordUpdate} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                          <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Key className="text-blue-500" size={20} /> Change Password
                          </h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                              <input 
                                type="password"
                                required
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                              <input 
                                type="password"
                                required
                                minLength={6}
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                              <input 
                                type="password"
                                required
                                minLength={6}
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {passMsg && (
                            <div className={`mt-6 p-3 rounded-lg text-sm flex items-center gap-2 ${passMsg.includes('Failed') || passMsg.includes('match') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                              {passMsg.includes('Failed') || passMsg.includes('match') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                              {passMsg}
                            </div>
                          )}

                          <div className="mt-8 flex justify-end">
                            <button 
                              type="submit" 
                              disabled={passLoading}
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all disabled:opacity-70 flex items-center gap-2"
                            >
                              {passLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                              Update Password
                            </button>
                          </div>
                        </form>
                      </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
