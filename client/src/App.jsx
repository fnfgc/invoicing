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
import { ShoppingCart, Trash2, Printer, CheckCircle, Plus, Minus, Package, X, LayoutDashboard, Users, LogOut, Lock, Menu, Key, Settings, Search, Keyboard, Smartphone, RefreshCw, AlertTriangle, TrendingUp, ShoppingBag, FileText, Upload, Edit3, Info, ChevronDown, Loader2, ArrowRight, Database, Globe, Layout } from 'lucide-react';
import VoiceInput from './VoiceInput';
import AiInsightsWidget from './AiInsightsWidget';
import FeatureLockedView from './FeatureLockedView';
// import './App.css'; // Removed in favor of Tailwind CSS

const emitToast = (message, type = 'info', duration = 3500) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }));
};

function ToastHost({ toasts, onDismiss }) {
  const getStyles = (type) => {
    if (type === 'success') return { container: 'border-emerald-200 bg-emerald-50', iconWrap: 'bg-emerald-600 text-white', icon: <CheckCircle size={18} /> };
    if (type === 'error') return { container: 'border-rose-200 bg-rose-50', iconWrap: 'bg-rose-600 text-white', icon: <AlertTriangle size={18} /> };
    if (type === 'warning') return { container: 'border-amber-200 bg-amber-50', iconWrap: 'bg-amber-600 text-white', icon: <AlertTriangle size={18} /> };
    return { container: 'border-blue-200 bg-blue-50', iconWrap: 'bg-blue-600 text-white', icon: <Info size={18} /> };
  };

  return (
    <div className="fixed top-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((t) => {
        const styles = getStyles(t.type);
        return (
          <div key={t.id} className={`w-full rounded-xl border p-4 shadow-lg shadow-slate-200/60 ${styles.container}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg ${styles.iconWrap}`}>
                {styles.icon}
              </div>
              <div className="flex-1 text-sm font-medium text-slate-800 whitespace-pre-line">{t.message}</div>
              <button className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 transition-colors" onClick={() => onDismiss(t.id)}>
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
function Login({ onLogin, onSignup, tenantInfo }) {
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
        
        // Prevent Super Admin from logging in via Tenant URL
        if (tenantInfo && (res.data.role === 'superadmin' || res.data.email === 'superadmin@fnf.com')) {
            setError(t('superadmin_tenant_login_error') || "Super Admin cannot login from a tenant URL. Please use the main portal.");
            return;
        }

        // Store Token
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          // Also store user details if needed
          localStorage.setItem('user_role', res.data.role);
        }
        onLogin({
          name: res.data.name || 'User',
          role: res.data.role || 'cashier',
          email: username,
          aiEnabled: res.data.aiEnabled,
          accountingEnabled: res.data.accountingEnabled,
          subscriptionExpired: !!res.data.subscriptionExpired,
          subscriptionExpiry: res.data.subscriptionExpiry || null,
          planName: res.data.planName || null,
          planPrice: res.data.planPrice ?? null
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
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold shadow-lg shadow-blue-500/30 transform rotate-3">
             {tenantInfo ? tenantInfo.name.substring(0, 2).toUpperCase() : 'FNF'}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{tenantInfo ? tenantInfo.name : t('pos_system_login')}</h2>
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

function SubscriptionExpiredOverlay({ user, onLogout }) {
  const planLabel = user?.planName ? String(user.planName) : 'Your Plan';
  const priceLabel =
    user?.planPrice === null || user?.planPrice === undefined || Number.isNaN(Number(user?.planPrice))
      ? null
      : Number(user.planPrice);
  const expiryLabel = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString() : null;
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/api/payment-instructions')
      .then((res) => {
        if (cancelled) return;
        setPayment(res.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const payEmail = payment?.email || 'info@fnfgc.com';
  const payBankName = payment?.bankName || 'HBL';
  const payAccountTitle = payment?.accountTitle || 'FAIZAN RASHEED';
  const payAccountNumber = payment?.accountNumber || '22207902038103';
  const payIban = payment?.iban || 'PK08HABB0022207902038103';
  const payBranch = payment?.branch || 'FAISALABAD-AKBAR CHO';

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-white/60">
          <div className="px-6 py-5 border-b bg-slate-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Subscription Expired</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Please make a payment and send your user email and transfer receipt to{' '}
                  <a className="font-semibold text-blue-600 hover:text-blue-700 hover:underline" href={`mailto:${payEmail}`}>
                    {payEmail}
                  </a>
                  .
                </p>
              </div>
              <button
                onClick={onLogout}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">User</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 break-all">{user?.email || '-'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">Package</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{planLabel}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-500">Price</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {priceLabel === null ? '-' : `PKR ${priceLabel.toLocaleString()}`}
                </div>
              </div>
            </div>

            {expiryLabel && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Expired on: <span className="font-semibold">{expiryLabel}</span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-bold text-slate-900 mb-3">Bank Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Bank Name</div>
                  <div className="mt-1 font-semibold text-slate-900">{payBankName}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Account Title</div>
                  <div className="mt-1 font-semibold text-slate-900">{payAccountTitle}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">Account Number</div>
                  <div className="mt-1 font-mono font-semibold text-slate-900">{payAccountNumber}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xs font-semibold text-slate-500">IBAN</div>
                  <div className="mt-1 font-mono font-semibold text-slate-900 break-all">{payIban}</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 md:col-span-2">
                  <div className="text-xs font-semibold text-slate-500">Branch</div>
                  <div className="mt-1 font-semibold text-slate-900">{payBranch}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Send your user email (<span className="font-semibold break-all">{user?.email || '-'}</span>) and transfer receipt to{' '}
              <a className="font-semibold text-blue-600 hover:text-blue-700 hover:underline" href={`mailto:${payEmail}`}>
                {payEmail}
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Website / Storefront Component ---
function WebsiteView({ tenant }) {
    const [products, setProducts] = useState([]);
    const [storeInfo, setStoreInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'details', 'success'
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
    const [orderResult, setOrderResult] = useState(null);

    useEffect(() => {
        if (!tenant?.slug) return;
        setLoading(true);
        let cancelled = false;
        setStoreInfo(null);
        setProducts([]);

        api.get(`/api/store/${tenant.slug}/info`)
            .then((infoRes) => {
                if (cancelled) return;
                setStoreInfo(infoRes.data);

                const isWebsiteEnabled = infoRes.data?.website_enabled;
                const isPackageEnabled = infoRes.data?.package_allows_website;

                if (!isWebsiteEnabled || !isPackageEnabled) return;

                return api.get(`/api/store/${tenant.slug}/products`)
                    .then((prodRes) => {
                        if (cancelled) return;
                        setProducts(prodRes.data);
                    });
            })
            .catch((err) => {
                console.error("Failed to load store", err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [tenant?.slug]);

    if (!tenant) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading Store...</div>;

    const addToCart = (product) => {
        setCart(prev => {
             const existing = prev.find(p => p.id === product.id);
             if (existing) {
                 return prev.map(p => p.id === product.id ? {...p, quantity: p.quantity + 1} : p);
             }
             return [...prev, {...product, quantity: 1}];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        if (!customer.phone) {
            emitToast("Phone number is required", 'warning');
            return;
        }
        
        try {
            const res = await api.post(`/api/store/${tenant.slug}/order`, {
                items: cart,
                customer
            });
            if (res.data.success) {
                setOrderResult(res.data);
                setCheckoutStep('success');
                setCart([]);
            }
        } catch (err) {
            emitToast("Failed to place order: " + (err.response?.data?.error || err.message), 'error');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    if (!storeInfo) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                    <AlertTriangle size={48} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Store Unavailable</h1>
                <p className="text-slate-600 max-w-md mb-8">
                    We couldn&apos;t load this store right now. Please try again later.
                </p>
            </div>
        );
    }

    // Maintenance Mode Check
    const isWebsiteEnabled = storeInfo?.website_enabled;
    const isPackageEnabled = storeInfo?.package_allows_website;

    if (!isWebsiteEnabled || !isPackageEnabled) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                    <Lock size={48} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Store Currently Unavailable</h1>
                <p className="text-slate-600 max-w-md mb-8">
                    {!isPackageEnabled 
                        ? "This store is currently not available on the current subscription plan." 
                        : "The store is currently in maintenance mode. Please check back later."}
                </p>
                <div className="text-sm text-slate-400">
                    {storeInfo?.business_name}
                </div>
            </div>
        );
    }

    const themeColor = storeInfo?.website_theme_color || '#2563eb';
    const primaryStyle = { backgroundColor: themeColor };
    const textStyle = { color: themeColor };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-30 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                         <div style={primaryStyle} className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                            {storeInfo?.business_name?.substring(0, 2).toUpperCase() || 'ST'}
                         </div>
                         <div>
                             <h1 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-slate-700 transition-colors">{storeInfo?.business_name || 'Store'}</h1>
                             <p className="text-xs text-slate-500 font-medium">{storeInfo?.business_address || 'Online Store'}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            className="relative p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                        >
                            <ShoppingCart size={24} />
                            {cart.length > 0 && <span style={primaryStyle} className="absolute -top-1 -right-1 w-6 h-6 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>}
                        </button>
                        <a href="/login" className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Admin Login</a>
                    </div>
                </div>
            </header>
            
            {/* Hero Section */}
            <div className="relative bg-slate-900 text-white overflow-hidden min-h-[500px] flex items-center">
                {storeInfo?.website_banner ? (
                    <div className="absolute inset-0">
                        <img src={storeInfo.website_banner} className="w-full h-full object-cover opacity-50" alt="Store Banner" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/30"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/20 to-transparent"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
                         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    </div>
                )}
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
                     <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 drop-shadow-lg leading-tight">
                            {storeInfo?.website_welcome_title || `Welcome to ${storeInfo?.business_name}`}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 drop-shadow-md">
                            {storeInfo?.website_welcome_message || 'Browse our products and order online. We deliver quality directly to your doorstep.'}
                        </p>
                        <button 
                            onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}
                            style={primaryStyle}
                            className="px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 flex items-center gap-2"
                        >
                            Start Shopping <ArrowRight size={20} />
                        </button>
                     </div>
                </div>
            </div>

            {/* About Section */}
            {storeInfo?.website_about && (
                <section className="bg-white py-20 border-b border-slate-100">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-6">
                            <Info size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">About Us</h2>
                        <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line font-medium">{storeInfo.website_about}</p>
                    </div>
                </section>
            )}

            {/* Products */}
            <main id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                 <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Products</h2>
                        <p className="text-slate-500">Discover our latest collection</p>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600">{products.length} Items</div>
                 </div>

                 {products.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                             <Package size={32} />
                         </div>
                         <h3 className="text-lg font-medium text-slate-900">No products available</h3>
                         <p className="text-slate-500">Check back later!</p>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map(product => (
                            <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                                <div className="h-64 bg-slate-100 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <Package size={64} className="text-slate-300" />
                                    )}
                                    {product.stock <= 0 && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold shadow-sm">Out of Stock</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                        <button 
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock <= 0}
                                            style={primaryStyle}
                                            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md">{product.category || 'Item'}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2 text-lg line-clamp-1" title={product.name}>{product.name}</h3>
                                    <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">{product.description || 'No description available for this product.'}</p>
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                                        <span className="text-xl font-bold text-slate-900">PKR {Number(product.price).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                 )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-16 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                            <div style={primaryStyle} className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {storeInfo?.business_name?.substring(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{storeInfo?.business_name}</h3>
                        </div>
                        <p className="text-slate-500 max-w-xs mx-auto md:mx-0">{storeInfo?.business_address}</p>
                    </div>
                    
                    {(storeInfo?.website_instagram || storeInfo?.website_facebook) && (
                        <div className="flex gap-4">
                            {storeInfo?.website_instagram && (
                                <a href={storeInfo.website_instagram} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition-all hover:scale-110">
                                    <Globe size={20} />
                                </a>
                            )}
                             {storeInfo?.website_facebook && (
                                <a href={storeInfo.website_facebook} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-110">
                                    <Globe size={20} />
                                </a>
                            )}
                        </div>
                    )}

                    <div className="text-slate-400 text-sm">
                        &copy; {new Date().getFullYear()} {storeInfo?.business_name}. Powered by FNF POS.
                    </div>
                </div>
            </footer>

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingBag size={24} style={textStyle}/> 
                                {checkoutStep === 'success' ? 'Order Confirmed' : (checkoutStep === 'details' ? 'Checkout Details' : 'Your Cart')}
                            </h2>
                            <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            {checkoutStep === 'cart' && (
                                <>
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center pb-20">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                <ShoppingCart size={48} className="opacity-20" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">Your cart is empty</h3>
                                            <p className="max-w-xs mx-auto mb-8">Looks like you haven't added anything to your cart yet.</p>
                                            <button 
                                                onClick={() => setIsCartOpen(false)} 
                                                style={textStyle}
                                                className="font-bold hover:underline"
                                            >
                                                Start Shopping
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {cart.map((item, idx) => (
                                                <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-400" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                                                        <p style={textStyle} className="font-bold mt-1">PKR {item.price} <span className="text-slate-400 text-xs font-normal">x {item.quantity}</span></p>
                                                    </div>
                                                    <div className="flex flex-col justify-between items-end">
                                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors">
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <div className="text-sm font-bold text-slate-900">
                                                            {Number(item.price * item.quantity).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {checkoutStep === 'details' && (
                                <form onSubmit={handlePlaceOrder} className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm flex items-start gap-3">
                                        <Info size={18} className="flex-shrink-0 mt-0.5" />
                                        <p>Please enter your details to complete the order. Payment will be collected upon delivery.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={customer.name}
                                            onChange={e => setCustomer({...customer, name: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                                            style={{ '--tw-ring-color': themeColor, '--tw-ring-opacity': '0.5' }}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                        <input 
                                            type="tel" 
                                            required
                                            value={customer.phone}
                                            onChange={e => setCustomer({...customer, phone: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
                                            style={{ '--tw-ring-color': themeColor, '--tw-ring-opacity': '0.5' }}
                                            placeholder="0300 1234567"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Delivery Address</label>
                                        <textarea 
                                            required
                                            value={customer.address}
                                            onChange={e => setCustomer({...customer, address: e.target.value})}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-opacity-50 outline-none transition-all resize-none"
                                            style={{ '--tw-ring-color': themeColor, '--tw-ring-opacity': '0.5' }}
                                            placeholder="House #, Street, City"
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </form>
                            )}

                            {checkoutStep === 'success' && orderResult && (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-in zoom-in duration-500">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Order Placed!</h3>
                                    <p className="text-slate-600 mb-8">Your order <strong>{orderResult.orderId}</strong> has been received successfully.</p>
                                    
                                    <a 
                                        href={`https://wa.me/?text=Hi, I just placed an order ${orderResult.orderId} on your website.`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-[#128C7E] transition-all hover:-translate-y-1 w-full justify-center"
                                    >
                                        <Smartphone size={20} /> Chat on WhatsApp
                                    </a>
                                </div>
                            )}
                        </div>

                        {checkoutStep !== 'success' && cart.length > 0 && (
                            <div className="p-6 border-t bg-slate-50">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-slate-600 font-medium">Total</span>
                                    <span className="text-2xl font-bold text-slate-900">PKR {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                                </div>
                                {checkoutStep === 'cart' ? (
                                    <button 
                                        onClick={() => setCheckoutStep('details')}
                                        style={primaryStyle}
                                        className="w-full py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Proceed to Checkout <ArrowRight size={20} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handlePlaceOrder}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Confirm Order <CheckCircle size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
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
  const [confirmState, setConfirmState] = useState({ open: false, title: 'Confirm', message: '', action: null, tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel' });
  const [toasts, setToasts] = useState([]);

  const openConfirm = (messageOrOptions, action) => {
    if (typeof messageOrOptions === 'string') {
      setConfirmState({ open: true, title: 'Confirm', message: messageOrOptions, action, tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel' });
    } else {
      const { title = 'Confirm', message = '', tone = 'default', confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = messageOrOptions || {};
      setConfirmState({ open: true, title, message, action, tone, confirmLabel, cancelLabel });
    }
  };
  
  const addToast = React.useCallback((toast) => {
    const message = toast?.message;
    if (!message) return;

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const type = toast?.type || 'info';
    const duration = typeof toast?.duration === 'number' ? toast.duration : 3500;

    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, Math.max(800, duration));
  }, []);

  const dismissToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const searchInputRef = React.useRef(null);
  
  // Tenant Resolution State
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    const handler = (e) => addToast(e?.detail);
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, [addToast]);

  useEffect(() => {
    const resolveByPath = () => {
        // Try to resolve slug from path
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0) {
            const possibleSlug = segments[0];
            // List of reserved paths to ignore
            const reserved = ['api', 'static', 'assets', 'login', 'register', 'dashboard', 'settings', 'admin', 'superadmin'];
            if (!reserved.includes(possibleSlug)) {
                api.get(`/api/tenant/resolve?slug=${possibleSlug}`)
                   .then(res => {
                       if (res.data.found) {
                           setTenantInfo(res.data.tenant);
                           document.title = res.data.tenant.name || 'POS System';
                       }
                   })
                   .catch(() => {
                       // Silent fail or log
                       // console.error("Slug resolution failed", err);
                   });
            }
        }
    };

    const domain = window.location.hostname;
    // Skip for localhost if you want, or keep it for testing with hosts file
    if (domain && domain !== 'localhost' && !domain.startsWith('192.168.') && domain !== '127.0.0.1') {
       api.get(`/api/tenant/resolve?domain=${domain}`)
          .then(res => {
             if (res.data.found) {
                setTenantInfo(res.data.tenant);
                document.title = res.data.tenant.name || 'POS System';
             } else {
                 // Fallback to path resolution if domain not found (e.g. main domain)
                 resolveByPath();
             }
          })
          .catch(err => {
              console.error("Tenant resolution failed", err);
              // Fallback on error
              resolveByPath();
          });
    } else {
        resolveByPath();
    }
  }, []);
  
  // Customer & Loyalty State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  
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

  const toggleWebsiteStatus = async () => {
    if (settings.website_enabled) {
      openConfirm("Are you sure you want to disable your website? Customers will not be able to place orders.", async () => {
        const newStatus = false;
        setSettings(prev => ({ ...prev, website_enabled: newStatus }));
        try {
          await api.put('/api/tenant/website-status', { enabled: newStatus });
        } catch (err) {
          console.error("Failed to update website status", err);
          setSettings(prev => ({ ...prev, website_enabled: !newStatus }));
          emitToast("Failed to update website status", 'error');
        }
      });
      return;
    }

    const newStatus = !settings.website_enabled;
    setSettings(prev => ({ ...prev, website_enabled: newStatus }));
    try {
      await api.put('/api/tenant/website-status', { enabled: newStatus });
    } catch (err) {
      console.error("Failed to update website status", err);
      setSettings(prev => ({ ...prev, website_enabled: !newStatus }));
      emitToast("Failed to update website status", 'error');
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
            openConfirm('Clear cart?', () => setCart([]));
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
      if (!user.subscriptionExpired) {
        fetchProducts();
        fetchSettings();
      }
    }
  }, [user, isActivated]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('pos_user', JSON.stringify(userData));
    if (!userData.subscriptionExpired) {
      fetchProducts();
      fetchSettings();
    }
    
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
    return (
      <>
        <ToastHost toasts={toasts} onDismiss={dismissToast} />
        <ActivationView onActivate={() => { setIsActivated(true); setIsExpired(false); }} isExpired={isExpired} />
      </>
    );
  }

  if (!user) {
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    
    if (tenantInfo && !isLoginPage && !showSignup) {
        return (
          <>
            <ToastHost toasts={toasts} onDismiss={dismissToast} />
            <WebsiteView tenant={tenantInfo} />
          </>
        );
    }

    if (showSignup) {
      return (
        <>
          <ToastHost toasts={toasts} onDismiss={dismissToast} />
          <SignupView onBack={() => setShowSignup(false)} />
        </>
      );
    }
    return (
      <>
        <ToastHost toasts={toasts} onDismiss={dismissToast} />
        <Login onLogin={handleLogin} onSignup={() => setShowSignup(true)} tenantInfo={tenantInfo} />
      </>
    );
  }

  if (user.role === 'superadmin' || user.email === 'superadmin@fnf.com') {
    return (
      <>
        <ToastHost toasts={toasts} onDismiss={dismissToast} />
        <ErrorBoundary>
          <SuperAdminView onLogout={handleLogout} openConfirm={openConfirm} />
        </ErrorBoundary>
      </>
    );
  }

  const addToCart = (product) => {
    if (product.stock <= 0) {
      emitToast("Item is out of stock!", 'warning');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          emitToast("Cannot add more than available stock!", 'warning');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addVoiceItemsToCart = (items) => {
    setCart(prev => {
        let newCart = [...prev];
        let messages = [];
        
        items.forEach((item) => {
            // Find the product in the current products list to ensure we have latest stock info
            // The item from backend is a product object, but let's be safe
            const product = products.find(p => p.id === item.id);
            
            if (!product) {
                messages.push(`Product not found: ${item.name || 'Unknown'}`);
                return;
            }

            const quantityToAdd = item.quantity || 1;
            const existingIndex = newCart.findIndex(cartItem => cartItem.id === product.id);
            
            if (existingIndex >= 0) {
                const currentQty = newCart[existingIndex].quantity;
                const newQty = currentQty + quantityToAdd;
                
                if (newQty <= product.stock) {
                    newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQty };
                } else {
                    newCart[existingIndex] = { ...newCart[existingIndex], quantity: product.stock };
                    messages.push(`Max stock reached for ${product.name}`);
                }
            } else {
                if (quantityToAdd <= product.stock) {
                    newCart.push({ ...product, quantity: quantityToAdd });
                } else {
                    newCart.push({ ...product, quantity: product.stock });
                    messages.push(`Max stock reached for ${product.name}`);
                }
            }
        });
        
        if (messages.length > 0) {
            // alert(messages.join('\n')); // Optional: too intrusive?
            console.log(messages);
        }
        
        return newCart;
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
          emitToast("Cannot exceed available stock!", 'warning');
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
    const fbrFee = 1;
    return { subtotal, tax, fbrFee, total: subtotal + tax + fbrFee };
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);

    const pointsDiscount = redeemedPoints / 100;
    const finalTotal = calculateTotal().total - pointsDiscount;

    const payload = {
      items: cart,
      buyerName: buyerInfo.name,
      buyerCNIC: buyerInfo.cnic,
      buyerNTN: buyerInfo.ntn,
      buyerPhone: buyerInfo.phone,
      discount: pointsDiscount,
      totalAmount: finalTotal,
      customerId: selectedCustomer?.id,
      redeemedPoints
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
          totals: {
              ...calculateTotal(),
              discount: pointsDiscount,
              total: finalTotal
          }
        });
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        setCart([]);
        fetchProducts(); // Refresh stock
        
        // Reset loyalty state
        setSelectedCustomer(null);
        setRedeemedPoints(0);
        setBuyerInfo({
          name: 'Walk-in Customer',
          cnic: '99999-9999999-9',
          ntn: '',
          phone: ''
        });
      }
    } catch (error) {
      emitToast("Error processing invoice: " + (error.response?.data?.message || error.message), 'error');
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
            <img
              src="/brand-logo.png"
              alt="FNF"
              className="h-8 w-8 object-contain"
            />
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">{user.role}</span>
          </div>
          <button className="block p-1 text-slate-600 sm:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <div className={`fixed inset-0 z-30 flex flex-col bg-white p-4 transition-transform duration-300 sm:static sm:flex sm:flex-row sm:items-center sm:gap-2 sm:bg-transparent sm:p-0 sm:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}`}>
          <div className="mb-6 sm:hidden">
             <div className="text-lg font-bold text-slate-900">{t('welcome')}, {user.name}</div>
             <div className="text-xs text-slate-500">{tenantInfo ? tenantInfo.name : 'FNF Group'} | v1.0.0</div>
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
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${view === 'transactions' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                onClick={() => handleViewChange('transactions')}
              >
                <Database size={18} /> Transactions
              </button>
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
          
          {/* <button 
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (Alt+H)"
          >
            <Keyboard size={18} /> {t('keyboard_shortcuts')}
          </button> */}

          <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 sm:ml-4" onClick={handleLogout}>
            <LogOut size={18} /> {t('logout')}
          </button>
        </div>
        
        <div className="hidden text-right sm:block">
           <div className="text-sm font-semibold text-slate-900">{t('welcome')}, {user.name}</div>
           <div className="text-xs text-slate-500">{tenantInfo ? tenantInfo.name : 'FNFPOS'} - v1.0</div>
        </div>
      </header>

      {view === 'pos' && (
        <div className="flex h-full flex-col overflow-hidden sm:flex-row">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b bg-white px-6 py-4">
               <div className="flex w-full max-w-md items-center gap-2">
                 <div className="relative flex-1">
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
                 <VoiceInput onItemsRecognized={addVoiceItemsToCart} locked={!user.aiEnabled} />
                 
                 <button 
                    onClick={toggleWebsiteStatus}
                    className={`ml-2 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border ${settings.website_enabled ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                    title={settings.website_enabled ? "Website Online" : "Website Offline"}
                 >
                    <Globe size={20} />
                    <span className="hidden lg:inline">{settings.website_enabled ? "Online" : "Offline"}</span>
                 </button>
               </div>
            </div>
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 overflow-y-auto p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 bg-slate-50/50">
              {products
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock < 5;
                  
                  return (
                    <div 
                      key={product.id} 
                      className={`group relative flex min-h-[220px] cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-blue-500/20 border border-slate-100 ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''} ${isLowStock ? 'border-amber-200 bg-amber-50/30' : ''}`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <div className="h-32 w-full shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                        <span className="text-4xl font-black text-blue-200/50 select-none transform -rotate-12 group-hover:scale-110 transition-transform duration-500">
                          {(product.name || '??').substring(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
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
            {/* Customer Section */}
            <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50/50">
               <div className="flex items-center gap-2">
                 <Users size={18} className="text-blue-600" />
                 {selectedCustomer ? (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{selectedCustomer.name}</span>
                        <span className="text-xs text-green-600 font-medium">{selectedCustomer.loyaltyPoints} Points</span>
                    </div>
                 ) : (
                    <span className="text-sm font-medium text-slate-600">Walk-in Customer</span>
                 )}
               </div>
               <button 
                 className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded transition-colors"
                 onClick={() => setIsCustomerModalOpen(true)}
               >
                 {selectedCustomer ? 'Change' : 'Select Customer'}
               </button>
            </div>

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

      {view === 'transactions' && <POSTransactionsView />}
      {view === 'inventory' && <InventoryView products={products} onUpdate={fetchProducts} user={user} openConfirm={openConfirm} />}
      {view === 'dashboard' && <DashboardView user={user} onNavigate={setView} />}
      {view === 'users' && <UserManagementView user={user} openConfirm={openConfirm} />}
      {view === 'settings' && <SettingsView settings={settings} onUpdate={fetchSettings} user={user} tenantInfo={tenantInfo} />}
      {view === 'reports' && <ReportsView />}
      {view === 'accounting' && (
        (user.accountingEnabled === false || user.accountingEnabled === 0) ? (
          <FeatureLockedView 
            featureName={t('accounting') || 'Accounting Module'} 
            onUpgrade={() => emitToast(t('contact_admin_upgrade') || "Please contact administrator to upgrade your package.", 'info')} 
          />
        ) : (
          <AccountingView />
        )
      )}
      {view === 'customers' && (
        (user.accountingEnabled === false || user.accountingEnabled === 0) ? (
          <FeatureLockedView 
            featureName={t('customers') || 'Customer Management'} 
            onUpgrade={() => emitToast(t('contact_admin_upgrade') || "Please contact administrator to upgrade your package.", 'info')} 
          />
        ) : (
          <PartnersView type="customer" />
        )
      )}
      {view === 'vendors' && (
        (user.accountingEnabled === false || user.accountingEnabled === 0) ? (
          <FeatureLockedView 
            featureName={t('vendors') || 'Vendor Management'} 
            onUpgrade={() => emitToast(t('contact_admin_upgrade') || "Please contact administrator to upgrade your package.", 'info')} 
          />
        ) : (
          <PartnersView type="vendor" />
        )
      )}

      {/* Shortcuts Modal */}
      {isShortcutsOpen && (
        <ShortcutsHelp onClose={() => setIsShortcutsOpen(false)} />
      )}
      
      {confirmState.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => setConfirmState({ open: false, title: 'Confirm', message: '', action: null, tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel' })}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <div className={`flex items-center justify-between border-b px-6 py-4 ${confirmState.tone === 'danger' ? 'bg-rose-50' : confirmState.tone === 'warning' ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${confirmState.tone === 'danger' ? 'bg-rose-600 text-white' : confirmState.tone === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
                    {confirmState.tone === 'danger' ? <AlertTriangle size={18} /> : confirmState.tone === 'warning' ? <AlertTriangle size={18} /> : <Info size={18} />}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{confirmState.title}</h2>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setConfirmState({ open: false, title: 'Confirm', message: '', action: null, tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel' })}>
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 text-sm text-slate-700 whitespace-pre-line">{confirmState.message}</div>
              <div className="px-6 py-4 flex justify-end gap-3">
                <button className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setConfirmState({ open: false, title: 'Confirm', message: '', action: null, tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel' })}>{confirmState.cancelLabel || 'Cancel'}</button>
                <button
                  className={`px-6 py-2 text-white font-medium rounded-lg shadow-md ${confirmState.tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : confirmState.tone === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={async () => {
                    const fn = confirmState.action;
                    setConfirmState({ open: false, title: 'Confirm', message: '', action: null, tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel' });
                    if (fn) await fn();
                  }}
                >
                  {confirmState.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ToastHost toasts={toasts} onDismiss={dismissToast} />

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => setIsCustomerModalOpen(false)}>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                     <CustomerLoyaltyWidget 
                        onSelect={customer => {
                            setSelectedCustomer(customer);
                            setBuyerInfo(prev => ({...prev, name: customer.name, phone: customer.phoneNumber || ''}));
                            setIsCustomerModalOpen(false);
                        }} 
                        onClose={() => setIsCustomerModalOpen(false)} 
                     />
                </div>
            </div>
        </div>
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
                  
                  {selectedCustomer && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-blue-800">Loyalty Program</span>
                            <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">
                                {selectedCustomer.loyaltyPoints} Pts Available
                            </span>
                        </div>
                        
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-blue-700 mb-1">Redeem Points (100 Pts = 1 PKR)</label>
                                <input 
                                    type="number"
                                    min="0"
                                    max={Math.min(selectedCustomer.loyaltyPoints, calculateTotal().total * 100)}
                                    value={redeemedPoints}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        const maxRedeemable = Math.min(selectedCustomer.loyaltyPoints, calculateTotal().total * 100);
                                        setRedeemedPoints(Math.min(val, maxRedeemable));
                                    }}
                                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                                />
                            </div>
                            <div className="flex-1 text-right">
                                <div className="text-xs text-blue-600 mb-1">Discount Amount</div>
                                <div className="font-bold text-lg text-blue-800">Rs {(redeemedPoints / 100).toFixed(2)}</div>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                            <span className="text-sm text-blue-700">Net Payable:</span>
                            <span className="font-bold text-xl text-blue-900">
                                Rs {(calculateTotal().total - (redeemedPoints / 100)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                  )}
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
      {user?.subscriptionExpired && <SubscriptionExpiredOverlay user={user} onLogout={handleLogout} />}
    </div>
  );
}


function CustomerLoyaltyWidget({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phoneNumber: '', cardNumber: '' });

  useEffect(() => {
    if (query.length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await api.get(`/api/customers?query=${query}`);
          setCustomers(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
        setCustomers([]);
    }
  }, [query]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await api.post('/api/customers', newCustomer);
        onSelect(res.data);
    } catch (err) {
        emitToast(err.response?.data?.error || err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
       <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{isRegistering ? 'New Customer' : 'Select Customer'}</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}><X size={20} /></button>
       </div>
       
       <div className="p-6 flex-1 overflow-y-auto">
          {!isRegistering ? (
             <>
               <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Search by Name, Phone or Card..." 
                   value={query}
                   onChange={e => setQuery(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 />
               </div>
               
               {loading && <div className="text-center py-4 text-slate-500">Searching...</div>}
               
               <div className="space-y-2">
                 {customers.map(c => (
                    <div key={c.id} onClick={() => onSelect(c)} className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors group">
                        <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-700">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.phoneNumber} {c.cardNumber && `| Card: ${c.cardNumber}`}</div>
                        </div>
                        <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{c.loyaltyPoints} Pts</div>
                    </div>
                 ))}
                 {customers.length === 0 && query.length > 2 && !loading && (
                    <div className="text-center py-4 text-slate-400">No customers found</div>
                 )}
               </div>

               <div className="mt-4 pt-4 border-t text-center">
                  <button onClick={() => setIsRegistering(true)} className="text-blue-600 font-medium hover:underline">
                    Register New Customer
                  </button>
               </div>
             </>
          ) : (
             <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                    <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input required value={newCustomer.phoneNumber} onChange={e => setNewCustomer({...newCustomer, phoneNumber: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Card Number / ID (Scan)</label>
                    <input autoFocus value={newCustomer.cardNumber} onChange={e => setNewCustomer({...newCustomer, cardNumber: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Scan card..." />
                </div>
                <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsRegistering(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md">
                        {loading ? 'Saving...' : 'Register'}
                    </button>
                </div>
             </form>
          )}
       </div>
    </div>
  );
}

function InventoryView({ products, onUpdate, user, openConfirm }) {
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
      emitToast("Failed to save product: " + (err.response?.data?.error || err.message), 'error');
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
        emitToast(`Successfully imported ${res.data.count} products!`, 'success');
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
    openConfirm('Are you sure you want to delete this product?', async () => {
      try {
        await api.delete(`/api/products/${id}`);
        onUpdate();
      } catch (err) {
        console.error("Failed to delete product", err);
        emitToast("Failed to delete product: " + (err.response?.data?.error || err.message), 'error');
      }
    });
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
      emitToast("Failed to update stock: " + (err.response?.data?.error || err.message), 'error');
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
          {data.totals.discount > 0 && (
            <div className="flex justify-between text-blue-600 font-medium">
                <span>Loyalty Discount:</span>
                <span>-{Number(data.totals.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Total Tax:</span>
            <span>{Number(data.totals.tax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>FBR POS Charge:</span>
            <span>1.00</span>
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

function POSTransactionsView() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ buyerName: '', buyerCNIC: '', buyerNTN: '', buyerPhone: '' });

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = async (query) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/pos/transactions', {
        params: { limit: 200, q: query || '' }
      });
      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const openDetail = async (row) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/pos/transactions/${row.id}`);
      setDetail(res.data);
      return res.data;
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to load transaction');
      setDetailOpen(false);
      return null;
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (row) => {
    const loaded = await openDetail(row);
    const next = {
      buyerName: loaded?.buyerName || row.buyerName || '',
      buyerCNIC: loaded?.buyerCNIC || row.buyerCNIC || '',
      buyerNTN: loaded?.buyerNTN || row.buyerNTN || '',
      buyerPhone: loaded?.buyerPhone || row.buyerPhone || ''
    };
    setEditForm(next);
    setEditOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!detail?.id) return;
    setLoading(true);
    setError('');
    try {
      await api.put(`/api/pos/transactions/${detail.id}`, editForm);
      setEditOpen(false);
      setDetailOpen(false);
      await load(q);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    if (!detail?.id) return;
    setLoading(true);
    setError('');
    try {
      await api.post(`/api/pos/transactions/${detail.id}/return`, { reason: returnReason });
      setReturnOpen(false);
      setDetailOpen(false);
      setReturnReason('');
      await load(q);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to return transaction');
    } finally {
      setLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!detail?.id) return;
    setLoading(true);
    setError('');
    try {
      await api.delete(`/api/pos/transactions/${detail.id}`);
      setDeleteOpen(false);
      setDetailOpen(false);
      await load(q);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (row) => {
    const base = (row.status || 'completed').toString().toLowerCase();
    if (row.deleted) return 'Deleted';
    if (base === 'returned') return 'Returned';
    return 'Completed';
  };

  const statusClasses = (row) => {
    const base = (row.status || 'completed').toString().toLowerCase();
    if (row.deleted || base === 'deleted') return 'bg-rose-100 text-rose-700';
    if (base === 'returned') return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  const detailStatus = detail
    ? {
        deleted: !!detail.deleted,
        status: (detail.status || '').toString().toLowerCase()
      }
    : { deleted: false, status: '' };

  const isReturned = detailStatus.status === 'returned';
  const isDeleted = detailStatus.deleted || detailStatus.status === 'deleted';

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">POS Transactions</h2>
              <p className="text-xs text-slate-500">View, edit, return, or delete sales</p>
            </div>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by invoice, customer, phone..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => load(q)}
              disabled={loading}
              title={t('retry_connection') || 'Refresh'}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle size={16} />
            <span className="flex-1">{error}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Invoice #</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Customer</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">Loading...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">No transactions found</td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-blue-50/30">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{row.invoiceNumber || `#${row.id}`}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{row.date ? new Date(row.date).toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{row.buyerName || row.customerName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{row.buyerPhone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-slate-800">PKR {Number(row.totalAmount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(row)}`}>
                          {statusLabel(row)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => openDetail(row)}
                          >
                            <Info size={14} className="inline-block mr-1" /> View
                          </button>
                          <button
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            onClick={() => openEdit(row)}
                            disabled={row.deleted || (row.status || '').toString().toLowerCase() === 'returned'}
                          >
                            <Edit3 size={14} className="inline-block mr-1" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => { setDetailOpen(false); setEditOpen(false); setReturnOpen(false); setDeleteOpen(false); }}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {detail?.invoiceNumber || 'Transaction'}
                    </h3>
                    <p className="text-xs text-slate-500">{detail?.date ? new Date(detail.date).toLocaleString() : ''}</p>
                  </div>
                </div>
                <button className="text-slate-500 hover:text-slate-700" onClick={() => { setDetailOpen(false); setEditOpen(false); setReturnOpen(false); setDeleteOpen(false); }}>
                  <X size={20} />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-6 text-sm text-slate-500">Loading...</div>
              ) : !detail ? (
                <div className="p-6 text-sm text-slate-500">No data</div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses(detail)}`}>
                      {statusLabel(detail)}
                    </span>
                    {(detail.returnedAt || detailStatus.status === 'returned') && (
                      <span className="text-xs text-slate-500">Returned at {detail.returnedAt ? new Date(detail.returnedAt).toLocaleString() : '-'}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Customer</div>
                      <div className="text-sm font-semibold text-slate-900">{detail.buyerName || detail.customerName || '-'}</div>
                      <div className="text-xs text-slate-500 mt-1">CNIC: {detail.buyerCNIC || '-'}</div>
                      <div className="text-xs text-slate-500">NTN: {detail.buyerNTN || '-'}</div>
                      <div className="text-xs text-slate-500">Phone: {detail.buyerPhone || '-'}</div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Totals</div>
                      <div className="text-sm font-semibold text-slate-900">PKR {Number(detail.totalAmount || 0).toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-1">Points Redeemed: {Number(detail.pointsRedeemed || 0)}</div>
                      <div className="text-xs text-slate-500">Points Amount: {Number(detail.pointsAmount || 0)}</div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <div className="border-b bg-white px-4 py-3 text-sm font-semibold text-slate-900">Items</div>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Product</th>
                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Qty</th>
                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Price</th>
                            <th className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(detail.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-4 text-sm text-slate-400 text-center">No items</td>
                            </tr>
                          ) : (
                            (detail.items || []).map((it, idx) => (
                              <tr key={idx} className="bg-white">
                                <td className="px-4 py-3 text-sm text-slate-700">{it.name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-right text-slate-700">{Number(it.quantity || 0)}</td>
                                <td className="px-4 py-3 text-sm text-right text-slate-700">{Number(it.price || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-slate-800">{Number((it.price || 0) * (it.quantity || 0)).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      onClick={() => {
                        setEditForm({
                          buyerName: detail.buyerName || '',
                          buyerCNIC: detail.buyerCNIC || '',
                          buyerNTN: detail.buyerNTN || '',
                          buyerPhone: detail.buyerPhone || ''
                        });
                        setEditOpen(true);
                        setReturnOpen(false);
                        setDeleteOpen(false);
                      }}
                      disabled={isReturned || isDeleted}
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                      onClick={() => {
                        setReturnOpen(true);
                        setEditOpen(false);
                        setDeleteOpen(false);
                      }}
                      disabled={isReturned || isDeleted}
                    >
                      <RefreshCw size={16} /> Return
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                      onClick={() => {
                        setDeleteOpen(true);
                        setEditOpen(false);
                        setReturnOpen(false);
                      }}
                      disabled={isDeleted}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailOpen && editOpen && detail && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => setEditOpen(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Edit Transaction</h3>
                <button className="text-slate-500 hover:text-slate-700" onClick={() => setEditOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={submitEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                  <input
                    value={editForm.buyerName}
                    onChange={(e) => setEditForm({ ...editForm, buyerName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CNIC</label>
                    <input
                      value={editForm.buyerCNIC}
                      onChange={(e) => setEditForm({ ...editForm, buyerCNIC: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NTN</label>
                    <input
                      value={editForm.buyerNTN}
                      onChange={(e) => setEditForm({ ...editForm, buyerNTN: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    value={editForm.buyerPhone}
                    onChange={(e) => setEditForm({ ...editForm, buyerPhone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setEditOpen(false)}>Cancel</button>
                  <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading}>Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detailOpen && returnOpen && detail && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => setReturnOpen(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Return Transaction</h3>
                <button className="text-slate-500 hover:text-slate-700" onClick={() => setReturnOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={submitReturn} className="p-6 space-y-4">
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                  This will add stock back for all items and mark the transaction as returned.
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Return Reason (optional)</label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setReturnOpen(false)}>Cancel</button>
                  <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50" disabled={loading}>Confirm Return</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detailOpen && deleteOpen && detail && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={() => setDeleteOpen(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Delete Transaction</h3>
                <button className="text-slate-500 hover:text-slate-700" onClick={() => setDeleteOpen(false)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                  This will restock items (if not already returned) and hide this transaction from reports.
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setDeleteOpen(false)}>Cancel</button>
                  <button type="button" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50" onClick={submitDelete} disabled={loading}>Confirm Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
    description: '',
    fbrInvoiceNumber: ''
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
      description: '',
      fbrInvoiceNumber: ''
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
      description: '',
      fbrInvoiceNumber: ''
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
        description: form.description,
        fbrInvoiceNumber: form.fbrInvoiceNumber || undefined
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
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">FBR</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receivables.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-6 text-center text-sm text-slate-400">
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
                            <td className="px-6 py-3 text-sm">
                              {(() => {
                                if (!row.fbrResponse) return <span className="text-slate-400">-</span>;
                                try {
                                  const fbr = JSON.parse(row.fbrResponse);
                                  if (fbr.InvoiceNumber) {
                                    return (
                                      <div className="flex flex-col">
                                        <span className="text-xs font-mono font-medium text-emerald-600">{fbr.InvoiceNumber}</span>
                                        {fbr.USIN && <span className="text-[10px] text-slate-400">USIN: {fbr.USIN}</span>}
                                      </div>
                                    );
                                  }
                                  if (fbr.error) {
                                    return <span className="text-xs font-medium text-red-500" title={fbr.error}>Failed</span>;
                                  }
                                } catch { return <span className="text-slate-400">Error</span>; }
                                return <span className="text-slate-400">-</span>;
                              })()}
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
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">FBR</th>
                        <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('actions') || 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payables.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-6 text-center text-sm text-slate-400">
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
                            <td className="px-6 py-3 text-sm">
                              {(() => {
                                if (!row.fbrResponse) return <span className="text-slate-400">-</span>;
                                try {
                                  const fbr = JSON.parse(row.fbrResponse);
                                  return fbr.InvoiceNumber ? (
                                    <span className="text-xs font-mono font-medium text-slate-600">{fbr.InvoiceNumber}</span>
                                  ) : <span className="text-slate-400">-</span>;
                                } catch { return <span className="text-slate-400">-</span>; }
                              })()}
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
                        <span>{t('total_billed_amount') || 'Total Billed Amount'}</span>
                        <span className="font-semibold">
                          PKR {Number(payableReport.totalPayable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span>{t('total_payable') || 'Total Payable'}</span>
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
                  {showBillModal && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor FBR Invoice #</label>
                      <input
                        value={form.fbrInvoiceNumber || ''}
                        onChange={e => setForm({ ...form, fbrInvoiceNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g. FBR-123456789"
                      />
                    </div>
                  )}
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
      
      {/* AI Sales Co-Pilot Widget */}
      <AiInsightsWidget />

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

function UserManagementView({ user, openConfirm }) {
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
        emitToast("User updated successfully!", 'success');
      } else {
        // Create new user
        await api.post('/api/users', formData);
        emitToast("User created successfully!", 'success');
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
    openConfirm(t('delete_user_confirm') || 'Are you sure you want to delete this user?', async () => {
      try {
        await api.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        emitToast(err.response?.data?.error || 'Failed to delete user', 'error');
      }
    });
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

function SettingsView({ settings, onUpdate, user, tenantInfo }) {
  const [activeView, setActiveView] = useState('general');
  const [formData, setFormData] = useState({
    business_name: settings.business_name || '',
    business_address: settings.business_address || '',
    business_contact: settings.business_contact || '',
    business_ntn: settings.business_ntn || '',
    business_strn: settings.business_strn || '',
    pos_id: settings.pos_id || '',
    fbr_pos_id: settings.fbr_pos_id || settings.pos_id || '',
    fbr_auth_token: settings.fbr_auth_token || '',
    fbr_api_url: settings.fbr_api_url || 'https://esp.fbr.gov.pk:8243/FBR/v1/api/Live/PostData',
    // CMS Fields
    website_theme_color: settings.website_theme_color || '#2563eb', // Default blue-600
    website_banner: settings.website_banner || '',
    website_welcome_title: settings.website_welcome_title || 'Welcome to our Online Store',
    website_welcome_message: settings.website_welcome_message || 'Browse our products and order online.',
    website_about: settings.website_about || '',
    website_instagram: settings.website_instagram || '',
    website_facebook: settings.website_facebook || '',
    website_enabled: settings.website_enabled !== undefined ? settings.website_enabled : true
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Domain Settings State
  const [domainData, setDomainData] = useState({ domain: '', slug: '' });
  const [domainMsg, setDomainMsg] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);

  useEffect(() => {
    // Update form data when settings prop changes
    setFormData(prev => ({
        ...prev,
        business_name: settings.business_name || '',
        business_address: settings.business_address || '',
        business_contact: settings.business_contact || '',
        business_ntn: settings.business_ntn || '',
        business_strn: settings.business_strn || '',
        pos_id: settings.pos_id || '',
        fbr_pos_id: settings.fbr_pos_id || settings.pos_id || '',
        fbr_auth_token: settings.fbr_auth_token || '',
        fbr_api_url: settings.fbr_api_url || 'https://esp.fbr.gov.pk:8243/FBR/v1/api/Live/PostData',
        // CMS Fields
        website_theme_color: settings.website_theme_color || '#2563eb',
        website_banner: settings.website_banner || '',
        website_welcome_title: settings.website_welcome_title || 'Welcome to our Online Store',
        website_welcome_message: settings.website_welcome_message || 'Browse our products and order online.',
        website_about: settings.website_about || '',
        website_instagram: settings.website_instagram || '',
        website_facebook: settings.website_facebook || '',
        website_enabled: settings.website_enabled !== undefined ? settings.website_enabled : true
    }));
  }, [settings]);

  useEffect(() => {
    if (activeView === 'domain' && user?.role === 'owner') {
        api.get('/api/settings/domain')
           .then(res => setDomainData({ domain: res.data.domain || '', slug: res.data.slug || '' }))
           .catch(err => console.error(err));
    }
  }, [activeView, user]);

  const handleDomainUpdate = async (e) => {
      e.preventDefault();
      setDomainLoading(true);
      setDomainMsg('');
      try {
          const res = await api.put('/api/settings/domain', { domain: domainData.domain, slug: domainData.slug });
          setDomainMsg('Settings updated successfully. ' + (res.data.message || ''));
          // Update local state with returned sanitized values
          if (res.data.slug) setDomainData(prev => ({ ...prev, slug: res.data.slug }));
          if (res.data.domain !== undefined) setDomainData(prev => ({ ...prev, domain: res.data.domain }));
      } catch (err) {
          setDomainMsg('Failed: ' + (err.response?.data?.error || err.message));
      } finally {
          setDomainLoading(false);
      }
  };

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
      // Update general settings
      await api.post('/api/settings', formData);
      
      // Update website status if we are in CMS view or if it changed
      if (formData.website_enabled !== undefined) {
          await api.put('/api/tenant/website-status', { enabled: formData.website_enabled });
      }

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
          emitToast(statusMsg, res.data.errors && res.data.errors.length > 0 ? 'warning' : 'success');
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

          <button 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'fbr' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
            onClick={() => setActiveView('fbr')}
          >
            <Database size={20} /> FBR Integration
          </button>

          <button 
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'ai' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
            onClick={() => setActiveView('ai')}
          >
            <Smartphone size={20} /> AI Configuration
          </button>
          
          {user?.role === 'owner' && (
            <button 
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'domain' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
                onClick={() => setActiveView('domain')}
            >
                <Globe size={20} /> Custom Domain
            </button>
          )}

          {user?.role === 'owner' && (
            <button 
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
                onClick={() => setActiveView('security')}
            >
                <Lock size={20} /> Security
            </button>
          )}

          {user?.role === 'owner' && (
            <button 
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 font-medium ${activeView === 'cms' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600 shadow-sm border border-slate-100'}`}
                onClick={() => setActiveView('cms')}
            >
                <Layout size={20} /> Website / CMS
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
                     {activeView === 'general' ? <Settings className="text-blue-500" size={24} /> : 
                      activeView === 'import' ? <RefreshCw className="text-blue-500" size={24} /> : 
                      activeView === 'fbr' ? <Database className="text-blue-500" size={24} /> :
                      activeView === 'ai' ? <Smartphone className="text-blue-500" size={24} /> :
                      activeView === 'domain' ? <Globe className="text-blue-500" size={24} /> :
                      <Lock className="text-blue-500" size={24} />}
                     
                     {activeView === 'general' ? 'Business Configuration' : 
                      activeView === 'import' ? 'Data Import & Migration' : 
                      activeView === 'fbr' ? 'FBR Digital Invoicing' :
                      activeView === 'ai' ? 'AI Assistant Configuration' :
                      activeView === 'domain' ? 'Custom Domain' :
                      'Security Settings'}
                   </h3>
                   <p className="text-slate-500 mt-1 text-sm">
                     {activeView === 'general' ? 'Update your business details and basic configuration.' : 
                      activeView === 'import' ? 'Migrate sales history from other software via CSV.' : 
                      activeView === 'fbr' ? 'Configure your connection to FBR for real-time invoice reporting.' :
                      activeView === 'ai' ? 'Configure OpenAI for Voice POS and other AI features.' :
                      activeView === 'domain' ? 'Connect your own domain to your POS system.' :
                      'Manage your password and security preferences.'}
                   </p>
                </div>
                
                <div className="space-y-6">
                  {activeView === 'fbr' && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Info size={18}/> FBR Integration Guide</h4>
                            <p className="text-sm text-blue-700">
                                Enter your FBR POS ID and Auth Token provided by the FBR Technical Team. 
                                Once configured, all new invoices will be automatically sent to FBR.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">FBR POS ID</label>
                                <input 
                                    value={formData.fbr_pos_id} 
                                    onChange={e => setFormData({...formData, fbr_pos_id: e.target.value})}
                                    placeholder="e.g. 123456"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                />
                                <p className="text-xs text-slate-500 mt-1">The unique POS ID assigned to this terminal.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Authorization Token</label>
                                <div className="relative">
                                    <input 
                                        value={formData.fbr_auth_token} 
                                        onChange={e => setFormData({...formData, fbr_auth_token: e.target.value})}
                                        placeholder="Bearer xxxxx-xxxx-xxxx"
                                        type="password"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Bearer Token for API authentication.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">API URL</label>
                                <input 
                                    value={formData.fbr_api_url} 
                                    onChange={e => setFormData({...formData, fbr_api_url: e.target.value})}
                                    placeholder="https://esp.fbr.gov.pk:8243/FBR/v1/api/Live/PostData"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                />
                                <p className="text-xs text-slate-500 mt-1">Default: https://esp.fbr.gov.pk:8243/FBR/v1/api/Live/PostData</p>
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
                                {loading ? 'Saving Configuration...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                  )}

                  {activeView === 'ai' && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl mb-6">
                            <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2"><Smartphone size={18}/> AI Voice POS Setup</h4>
                            <p className="text-sm text-purple-700">
                                To enable Hands-free billing (Voice POS), you need an OpenAI API Key. 
                                This allows the system to understand Urdu/English voice commands.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">OpenAI API Key</label>
                                <div className="relative">
                                    <input 
                                        value={formData.openai_api_key || ''} 
                                        onChange={e => setFormData({...formData, openai_api_key: e.target.value})}
                                        placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                                        type="password"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Your key is stored securely. Get one from platform.openai.com.</p>
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
                                {loading ? 'Saving Configuration...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                  )}

                  {activeView === 'domain' && (
                    <form onSubmit={handleDomainUpdate} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Globe size={18}/> Domain & URL Settings</h4>
                            <p className="text-sm text-blue-700">
                                Customize your store's web address. You can use a free sub-URL (slug) or connect your own custom domain.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Store URL (Slug)</label>
                                <div className="flex items-center">
                                    <span className="bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl px-4 py-3 text-slate-500 font-mono text-sm">
                                        {(getServerUrl() || window.location.origin).replace(/\/api$/, '')}/store/
                                    </span>
                                    <input 
                                        value={domainData.slug} 
                                        onChange={e => setDomainData({...domainData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                        placeholder="my-store"
                                        className="w-full px-4 py-3 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white font-mono text-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Unique identifier for your store. Only lowercase letters, numbers, and hyphens.</p>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Domain (Optional)</label>
                                <input 
                                    value={domainData.domain} 
                                    onChange={e => setDomainData({...domainData, domain: e.target.value})}
                                    placeholder="store.yourdomain.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    To use your own domain, point your domain's A Record to our server IP or CNAME to our domain.
                                </p>
                            </div>
                        </div>

                        {domainMsg && (
                            <div className={`p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${domainMsg.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                {domainMsg.includes('Failed') ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                                {domainMsg}
                            </div>
                        )}
                        
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-95" disabled={domainLoading}>
                                {domainLoading ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                  )}

                  {activeView === 'general' && (
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
                  )}
                  
                  {activeView === 'import' && (
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
                  )}
                  
                  {activeView === 'security' && (
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

                  {activeView === 'cms' && (
                    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-8 rounded-2xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
                            <h4 className="font-bold text-2xl text-indigo-900 mb-4 flex items-center gap-3 relative z-10">
                                <Layout className="text-indigo-600" size={28}/> 
                                Website Builder & CMS
                            </h4>
                            <p className="text-indigo-800 text-lg leading-relaxed max-w-2xl relative z-10">
                                Customize your single-page website. 
                                Set your brand colors, welcome message, and social links.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
                            <h5 className="font-bold text-slate-900 mb-6 text-lg">Your Business URL</h5>
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between group hover:border-blue-300 transition-colors">
                                    <code className="text-blue-600 font-mono font-medium text-lg truncate">
                                        {window.location.origin}/{tenantInfo?.slug || settings.pos_id || 'store'}
                                    </code>
                                    <button 
                                        className="text-slate-400 hover:text-blue-600 p-2"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/${tenantInfo?.slug || settings.pos_id || 'store'}`);
                                            emitToast('URL copied to clipboard!', 'success');
                                        }}
                                        title="Copy URL"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                </div>
                                <a 
                                    href={`/${tenantInfo?.slug || settings.pos_id || 'store'}`}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                >
                                    Visit Website <ArrowRight size={18} />
                                </a>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            
                            {/* Website Visibility Toggle */}
                            <div className={`p-6 rounded-xl border ${formData.website_enabled ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'} transition-colors duration-300`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h5 className={`font-bold text-lg ${formData.website_enabled ? 'text-green-800' : 'text-slate-700'}`}>
                                            {formData.website_enabled ? 'Website is Online' : 'Website is Offline'}
                                        </h5>
                                        <p className={`text-sm mt-1 ${formData.website_enabled ? 'text-green-700' : 'text-slate-500'}`}>
                                            {formData.website_enabled 
                                                ? 'Your store is visible to customers. They can browse products and place orders.' 
                                                : 'Your store is hidden. Customers will see a maintenance message.'}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.website_enabled} 
                                            onChange={e => setFormData({...formData, website_enabled: e.target.checked})}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Branding Section */}
                            <div>
                                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <Edit3 size={18} />
                                    </div>
                                    Branding & Appearance
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Theme Color</label>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="color"
                                                value={formData.website_theme_color} 
                                                onChange={e => setFormData({...formData, website_theme_color: e.target.value})}
                                                className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0 shadow-sm"
                                            />
                                            <span className="text-slate-500 font-mono text-sm">{formData.website_theme_color}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Banner Image URL</label>
                                        <input 
                                            value={formData.website_banner} 
                                            onChange={e => setFormData({...formData, website_banner: e.target.value})}
                                            placeholder="https://example.com/banner.jpg"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Direct link to an image (optional).</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Content Section */}
                            <div>
                                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                        <FileText size={18} />
                                    </div>
                                    Website Content
                                </h5>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Welcome Title</label>
                                        <input 
                                            value={formData.website_welcome_title} 
                                            onChange={e => setFormData({...formData, website_welcome_title: e.target.value})}
                                            placeholder="Welcome to FNF Supermarket"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Welcome Message</label>
                                        <textarea 
                                            value={formData.website_welcome_message} 
                                            onChange={e => setFormData({...formData, website_welcome_message: e.target.value})}
                                            placeholder="Order online and get fresh groceries delivered to your doorstep."
                                            rows="2"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">About Us</label>
                                        <textarea 
                                            value={formData.website_about} 
                                            onChange={e => setFormData({...formData, website_about: e.target.value})}
                                            placeholder="Tell your customers about your business history and values."
                                            rows="3"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Social Media */}
                            <div>
                                <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                                        <Globe size={18} />
                                    </div>
                                    Social Media Links
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Instagram URL</label>
                                        <input 
                                            value={formData.website_instagram} 
                                            onChange={e => setFormData({...formData, website_instagram: e.target.value})}
                                            placeholder="https://instagram.com/yourpage"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Facebook URL</label>
                                        <input 
                                            value={formData.website_facebook} 
                                            onChange={e => setFormData({...formData, website_facebook: e.target.value})}
                                            placeholder="https://facebook.com/yourpage"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {msg && (
                                <div className={`p-4 rounded-xl text-sm flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${msg.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                    {msg.includes('Failed') ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                                    {msg}
                                </div>
                            )}
                            
                            <div className="flex justify-end pt-6 border-t border-slate-100">
                                <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-95" disabled={loading}>
                                    {loading ? 'Saving Website...' : 'Save & Publish'}
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
