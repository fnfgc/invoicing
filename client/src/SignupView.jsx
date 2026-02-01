import React, { useState, useEffect } from 'react';
import axios from './api'; // Use api instance for baseURL
import { CheckCircle, Package, ArrowRight, ArrowLeft, X, CreditCard } from 'lucide-react';
import './App.css';

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
      <div className="signup-container">
        <div className="success-card">
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div className="success-icon-bg">
              <CheckCircle size={48} color="white" />
            </div>
            <h2>Registration Successful!</h2>
            <p>Your account has been created successfully.</p>
          </div>

          <div className="success-actions" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <p style={{textAlign: 'center', color: '#666', marginBottom: '0.5rem'}}>
               Please complete the payment to activate your account.
             </p>
             <button className="secondary-btn" onClick={() => setShowPaymentModal(true)} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px'}}>
                <CreditCard size={18} /> View Payment Instructions
             </button>
             <button className="primary-btn" onClick={onBack} style={{width: '100%'}}>
                Back to Login
             </button>
          </div>
        </div>

        {showPaymentModal && (
          <div className="modal-overlay" style={{zIndex: 1000}}>
            <div className="modal" style={{maxWidth: '500px', width: '90%'}}>
               <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                 <h2 style={{margin: 0, fontSize: '1.25rem'}}>Activate Your Account</h2>
                 <button className="close-btn" onClick={() => setShowPaymentModal(false)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '4px'}}>
                    <X size={24} />
                 </button>
               </div>
               
               <div className="payment-instructions">
                  <p style={{marginBottom: '1rem'}}>To activate your subscription, please transfer <strong>PKR {selectedPackage.price}</strong> to the following bank account:</p>
                  
                  <div className="bank-details" style={{background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem'}}>
                    <p style={{margin: '0.5rem 0'}}><strong>Bank Name:</strong> Meezan Bank</p>
                    <p style={{margin: '0.5rem 0'}}><strong>Account Title:</strong> FNF Solutions</p>
                    <p style={{margin: '0.5rem 0'}}><strong>Account Number:</strong> 0101-01010101-01</p>
                    <p style={{margin: '0.5rem 0'}}><strong>IBAN:</strong> PK00MEZN0000000000000000</p>
                  </div>

                  <p style={{fontSize: '0.9rem', color: '#666', lineHeight: '1.5'}}>
                    After payment, please send the receipt screenshot to our support team at <strong>support@fnf.com</strong> or WhatsApp <strong>+92-300-1234567</strong> for instant activation.
                  </p>
               </div>
               
               <div className="modal-actions" style={{marginTop: '2rem', display: 'flex', justifyContent: 'flex-end'}}>
                  <button className="primary-btn" onClick={() => setShowPaymentModal(false)}>
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
    <div className="signup-container">
      <header className="signup-header">
        <button className="back-link" onClick={() => step === 1 ? onBack() : setStep(1)}>
          <ArrowLeft size={16} /> {step === 1 ? 'Back to Login' : 'Back to Packages'}
        </button>
        <h1>{step === 1 ? 'Choose Your Plan' : 'Create Your Account'}</h1>
      </header>

      {step === 1 ? (
        <div className="packages-grid">
          {packages.map(pkg => (
            <div key={pkg.id} className="package-card">
              <div className="package-header">
                <h3>{pkg.name}</h3>
                <div className="price">PKR {pkg.price} <span>/ {pkg.duration_days} days</span></div>
              </div>
              <div className="package-features">
                {JSON.parse(pkg.features || '[]').map((f, i) => (
                  <div key={i} className="feature-item">
                    <CheckCircle size={16} className="feature-icon" /> {f}
                  </div>
                ))}
              </div>
              <button className="select-plan-btn" onClick={() => handlePackageSelect(pkg)}>
                Select Plan <ArrowRight size={16} />
              </button>
            </div>
          ))}
          {packages.length === 0 && <p>Loading packages...</p>}
        </div>
      ) : (
        <div className="signup-form-container">
          <div className="selected-plan-summary">
            <span>Selected Plan: <strong>{selectedPackage.name}</strong></span>
            <span>PKR {selectedPackage.price}</span>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <label>Business Name</label>
              <input 
                required 
                className="form-control"
                value={formData.business_name} 
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                placeholder="My Awesome Shop"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                required 
                className="form-control"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                required 
                className="form-control"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                required 
                className="form-control"
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="primary-btn" disabled={loading} style={{width: '100%', marginTop: '1rem'}}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default SignupView;
