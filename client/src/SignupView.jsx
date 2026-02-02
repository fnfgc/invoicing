import React, { useState, useEffect } from 'react';
import axios from './api'; // Use api instance for baseURL
import { CheckCircle, Package, ArrowRight, ArrowLeft, X, CreditCard } from 'lucide-react';
import './index.css';

function SignupView({ onBack }) {
  const [step, setStep] = useState(1); // 1: Packages, 2: Details, 3: Success
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      // Use raw axios or api instance. Since GET /api/packages is public, api instance is fine (it just adds token if present, which is null)
      const res = await axios.get('/api/packages');
      setPackages(res.data);
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
        packageId: selectedPackage.id
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                 <h2 className="text-lg font-bold text-slate-900">Activate Your Account</h2>
                 <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPaymentModal(false)}>
                    <X size={24} />
                 </button>
               </div>
               
               <div className="p-6">
                  <p className="mb-4 text-slate-600">To activate your subscription, please transfer <strong className="text-slate-900">PKR {selectedPackage.price}</strong> to the following bank account:</p>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-6">
                    <p className="flex justify-between text-sm"><span className="text-slate-500">Bank Name:</span> <span className="font-medium text-slate-900">Meezan Bank</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">Account Title:</span> <span className="font-medium text-slate-900">FNF Solutions</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">Account Number:</span> <span className="font-medium text-slate-900">0101-01010101-01</span></p>
                    <p className="flex justify-between text-sm"><span className="text-slate-500">IBAN:</span> <span className="font-medium text-slate-900">PK00MEZN0000000000000000</span></p>
                  </div>

                  <p className="text-slate-500 text-xs text-center leading-relaxed">
                    After payment, please send the receipt screenshot to our support team at <strong className="text-slate-700">support@fnf.com</strong> or WhatsApp <strong className="text-slate-700">+92-300-1234567</strong> for instant activation.
                  </p>
               </div>
               
               <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors" onClick={() => setShowPaymentModal(false)}>
                    Close
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-8 sm:mb-12">
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium" onClick={() => step === 1 ? onBack() : setStep(1)}>
          <ArrowLeft size={18} /> {step === 1 ? 'Back to Login' : 'Back to Packages'}
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{step === 1 ? 'Choose Your Plan' : 'Create Your Account'}</h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </header>

      {step === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              {/* Decorative gradient blob */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:bg-blue-100 transition-colors"></div>
              
              <div className="text-center border-b border-slate-100 pb-4 mb-6 relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-blue-600 my-2">PKR {pkg.price} <span className="text-sm font-medium text-slate-400">/ {pkg.duration_days} days</span></div>
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
                Select Plan <ArrowRight size={16} />
              </button>
            </div>
          ))}
          {packages.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Package size={48} className="mb-4 opacity-50" />
                <p>Loading subscription packages...</p>
             </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-4 mb-8 border border-blue-100">
            <div>
               <span className="block text-xs uppercase tracking-wide text-blue-500 font-semibold mb-1">Selected Plan</span>
               <strong className="text-blue-900 block">{selectedPackage.name}</strong>
            </div>
            <span className="text-xl font-bold text-blue-700">PKR {selectedPackage.price}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
              <input 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                value={formData.business_name} 
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                placeholder="e.g. My Awesome Shop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                minLength={6}
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white placeholder:text-slate-400"
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••"
              />
            </div>

            {error && <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 flex items-center gap-2"><X size={16} /> {error}</div>}

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default SignupView;
