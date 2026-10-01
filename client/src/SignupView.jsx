import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from './api'; // Use api instance for baseURL
import { CheckCircle, Package, ArrowRight, ArrowLeft, X, CreditCard } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import './index.css';

function SignupView({ onBack }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Packages, 2: Details, 3: Success
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    business_type: 'general',
    business_ntn: '',
    business_province: 'Punjab',
    fbr_auth_token: '',
    fbr_pos_id: '',
    fbr_environment: 'sandbox'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const businessTypes = [
    { id: 'pharmacy', name: 'Pharmacy / Medical', icon: '💊', desc: 'Batch #, Expiry, Generic formulas' },
    { id: 'grocery', name: 'Grocery / Supermarket', icon: '🛒', desc: 'Barcodes, Weighable units, 3rd Schedule' },
    { id: 'shoes', name: 'Shoes & Footwear', icon: '👟', desc: 'Sizes, Colors, Brand models' },
    { id: 'clothing', name: 'Clothing & Fashion', icon: '👕', desc: 'Sizes, Colors, Fabrics, Boutiques' },
    { id: 'takeaways', name: 'Takeaways / Restaurant', icon: '🍔', desc: 'Dine-in/Takeaway, Table/Token #, KOT' },
    { id: 'general', name: 'General Retail / Other', icon: '🏬', desc: 'Standard retail, electronics, general' }
  ];

  const provinces = [
    'Punjab',
    'Sindh',
    'Khyber Pakhtunkhwa',
    'Balochistan',
    'Islamabad Capital Territory',
    'Azad Jammu and Kashmir',
    'Gilgit-Baltistan'
  ];

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await axios.get('/api/packages');
      setPackages(res.data);
      if (res.data && res.data.length === 1) {
        setSelectedPackage(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch packages", err);
      setError("Failed to load subscription packages.");
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setStep(2);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/register', {
        business_name: formData.business_name,
        email: formData.email,
        password: formData.password,
        packageId: selectedPackage.id,
        business_type: formData.business_type,
        business_ntn: formData.business_ntn,
        business_province: formData.business_province,
        fbr_auth_token: formData.fbr_auth_token,
        fbr_pos_id: formData.fbr_pos_id,
        fbr_environment: formData.fbr_environment
      });
      setStep(3);
      setShowPaymentModal(true);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
              <CheckCircle size={48} color="white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful!</h2>
            <p className="text-slate-600">Your account has been created successfully.</p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
             <p className="text-slate-500 text-sm text-center mb-2">
               Please complete the payment to activate your account.
             </p>
             <button className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-medium transition-all" onClick={() => setShowPaymentModal(true)}>
                <CreditCard size={18} /> View Payment Instructions
             </button>
             <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all" onClick={onBack}>
                Back to Login
             </button>
          </div>
        </div>

        {showPaymentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                 <h2 className="text-lg font-bold text-slate-900">{t('activate_account_title')}</h2>
                 <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPaymentModal(false)}>
                    <X size={24} />
                 </button>
               </div>
               
               <div className="p-6">
                  <p className="mb-4 text-slate-600">{t('transfer_instruction')} <strong className="text-slate-900">${selectedPackage?.price || '19.99'} USD</strong> for single-user activation:</p>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-4">
                    <p className="flex justify-between text-sm"><span className="text-slate-500">{t('bank_name')}:</span> <span className="font-medium text-slate-900">HBL</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">{t('account_title')}:</span> <span className="font-medium text-slate-900">FAIZAN RASHEED</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">{t('account_number')}:</span> <span className="font-medium text-slate-900">22207902038103</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">{t('iban')}:</span> <span className="font-medium text-slate-900">PK08HABB0022207902038103</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">{t('branch') || 'Branch'}:</span> <span className="font-medium text-slate-900">FAISALABAD-AKBAR CHO</span></p>
                  </div>

                  <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100 mb-4 text-xs text-blue-900">
                    <span className="font-bold block mb-0.5">👤 User Capacity & Extra Seats:</span>
                    Includes <strong>1 full user account</strong>. Any additional cashier or staff accounts you add later from your dashboard are charged at <strong>$5.00 USD/month</strong> each.
                  </div>

                  <p className="text-slate-500 text-xs text-center leading-relaxed">
                    {t('payment_screenshot_instruction')} <strong className="text-slate-700">info@fnfgc.com</strong> or WhatsApp <strong className="text-slate-700">+92-302-0010222</strong> for instant activation.
                  </p>
               </div>
               
               <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors" onClick={() => setShowPaymentModal(false)}>
                    {t('close')}
                  </button>
               </div>
            </div>
          </div>
        </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-8 sm:mb-12">
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium" onClick={() => step === 1 ? onBack() : setStep(1)}>
          <ArrowLeft size={18} /> {step === 1 ? t('back_to_login') : t('back_to_packages')}
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{step === 1 ? t('choose_plan') : t('create_your_account')}</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </header>

      {step === 1 ? (
        packages.length === 1 ? (
          <div className="w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
                  Complete POS Plan
                </div>
                
                <div className="text-center border-b border-slate-100 pb-6 mb-6">
                  <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                    Single User • Full Access
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{pkg.name}</h2>
                  <div className="flex items-baseline justify-center gap-1 my-3">
                    <span className="text-4xl sm:text-5xl font-black text-blue-600">${pkg.price}</span>
                    <span className="text-slate-500 font-medium text-sm">/ {pkg.duration_days} days</span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Covers complete app access as a single user. Unlimited POS, inventory, accounting, and online store.
                  </p>
                  <div className="inline-flex items-center gap-2 mt-4 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-emerald-200/60 shadow-xs">
                    <span>👤 1 User Included</span>
                    <span>•</span>
                    <span>+$5.00/mo per extra staff</span>
                  </div>
                </div>
                
                <div className="space-y-3 flex-1 mb-8">
                  {JSON.parse(pkg.features || '[]').map((f, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                      <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" /> 
                      <span className="leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all flex items-center justify-center gap-2" 
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {t('select_plan') || 'Get Started Now'} <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                {/* Decorative gradient blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:bg-blue-100 transition-colors"></div>
                
                <div className="text-center border-b border-slate-100 pb-4 mb-6 relative z-10">
                  {pkg.ai_enabled === 1 && (
                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm border border-indigo-400">AI Powered</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 my-2">${pkg.price} <span className="text-sm font-medium text-slate-400">/ {pkg.duration_days} days</span></div>
                  <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    1 User incl. • +${Number(pkg.extra_user_price || 5).toFixed(2)}/mo extra user
                  </div>
                </div>
                
                <div className="space-y-3 flex-1 mb-8 relative z-10">
                  {JSON.parse(pkg.features || '[]').map((f, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                      <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" /> 
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </div>
                
                <button className="w-full py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 relative z-10" onClick={() => handlePackageSelect(pkg)}>
                  {t('select_plan')} <ArrowRight size={16} />
                </button>
              </div>
            ))}
            {packages.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <Package size={48} className="mb-4 opacity-50" />
                  <p>{t('loading_packages')}</p>
               </div>
            )}
          </div>
        )
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-8 border border-blue-200/80 shadow-xs">
            <div>
               <span className="block text-[10px] uppercase tracking-wider text-blue-600 font-bold mb-0.5">{t('selected_plan')}</span>
               <strong className="text-slate-900 text-base block">{selectedPackage ? selectedPackage.name : 'All-in-One POS'}</strong>
               <span className="text-xs text-slate-600 block mt-0.5">
                 1 User included • +${Number(selectedPackage?.extra_user_price || 5).toFixed(2)}/mo per extra user
               </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-600">${selectedPackage ? selectedPackage.price : '19.99'}</span>
              <span className="text-[11px] text-slate-500 block">/ {selectedPackage ? selectedPackage.duration_days : 30} days</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* POS Business Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">Select Your POS Business Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {businessTypes.map(bt => (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => setFormData({...formData, business_type: bt.id})}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formData.business_type === bt.id 
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{bt.icon}</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight">{bt.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{bt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('business_name')}</label>
              <input 
                required 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                value={formData.business_name} 
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                placeholder="e.g. Al-Madina Pharmacy / Super Mart"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Province (PRAL FBR)</label>
                <select
                  value={formData.business_province}
                  onChange={e => setFormData({...formData, business_province: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white text-sm outline-none"
                >
                  {provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business NTN / CNIC</label>
                <input 
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white text-sm outline-none"
                  value={formData.business_ntn} 
                  onChange={e => setFormData({...formData, business_ntn: e.target.value})}
                  placeholder="7-digit NTN or 13-digit CNIC"
                />
              </div>
            </div>

            {/* Collapsible/Optional FBR DI Integration */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> FBR Digital Invoicing Integration
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">v1.12 Spec</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Link your PRAL Bearer token now or later in Settings to stream sales live to FBR.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Environment</label>
                  <select
                    value={formData.fbr_environment}
                    onChange={e => setFormData({...formData, fbr_environment: e.target.value})}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">FBR POS ID</label>
                  <input
                    value={formData.fbr_pos_id}
                    onChange={e => setFormData({...formData, fbr_pos_id: e.target.value})}
                    placeholder="e.g. 123456"
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">PRAL Security Token (Bearer)</label>
                <input
                  type="password"
                  value={formData.fbr_auth_token}
                  onChange={e => setFormData({...formData, fbr_auth_token: e.target.value})}
                  placeholder="Paste 5-year PRAL Bearer Token (optional at signup)"
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email_address')}</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  minLength={6}
                  placeholder="••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('confirm_password')}</label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••"
                />
              </div>
            </div>

            {error && <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2"><X size={16} /> {error}</div>}

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2" disabled={loading}>
              {loading ? t('creating_account') : t('create_account')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default SignupView;
