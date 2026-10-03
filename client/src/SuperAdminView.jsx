import React, { useState, useEffect } from 'react';
import axios from './api';
import { Users, Package, Trash2, Plus, LogOut, CheckCircle, XCircle, Menu, X, Edit, RefreshCw, AlertTriangle, Landmark, FileText, Eye, Check, AlertCircle, ExternalLink, Download } from 'lucide-react';
import './index.css';

const emitToast = (message, type = 'info', duration = 3500) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }));
};

function SuperAdminView({ onLogout, openConfirm }) {
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'packages'
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [inspectingReceiptTenant, setInspectingReceiptTenant] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [tenantFilter, setTenantFilter] = useState('all'); // 'all' | 'pending' | 'receipts' | 'expired' | 'active'

  // Forms
  const [tenantForm, setTenantForm] = useState({
    business_name: '',
    email: '',
    password: '',
    packageId: ''
  });
  const [editingTenantId, setEditingTenantId] = useState(null);

  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    duration_days: 30,
    features: '', // comma separated
    ai_enabled: false,
    accounting_enabled: true,
    website_enabled: true,
    max_users: 1,
    extra_user_price: 5.00
  });
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    bankName: 'HBL',
    accountTitle: 'FAIZAN RASHEED',
    accountNumber: '22207902038103',
    iban: 'PK08HABB0022207902038103',
    branch: 'FAISALABAD-AKBAR CHO',
    email: 'info@fnfgc.com'
  });
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, packagesRes, paymentRes] = await Promise.allSettled([
        axios.get('/api/admin/tenants'),
        axios.get('/api/packages'),
        axios.get('/api/admin/payment-instructions')
      ]);

      if (tenantsRes.status === 'fulfilled') setTenants(tenantsRes.value.data);
      if (packagesRes.status === 'fulfilled') setPackages(packagesRes.value.data);
      if (paymentRes.status === 'fulfilled' && paymentRes.value?.data && Object.keys(paymentRes.value.data).length > 0) {
        setPaymentForm(prev => ({ ...prev, ...paymentRes.value.data }));
      }
      
      // Set default package selection
      if (packagesRes.status === 'fulfilled' && packagesRes.value.data.length > 0) {
        setTenantForm(prev => ({ ...prev, packageId: packagesRes.value.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTenant = async (id) => {
    const doActivate = async () => {
      try {
        const res = await axios.put(`/api/admin/tenants/${id}/activate`);
        setTenants(prev => prev.map(t => t.id === id ? { ...t, is_active: 1, payment_status: 'approved', subscription_expiry: res.data?.new_expiry || t.subscription_expiry } : t));
        fetchData();
        emitToast("Tenant activated successfully!", 'success');
      } catch (err) {
        emitToast("Error activating tenant: " + (err.response?.data?.error || err.message), 'error');
      }
    };

    if (typeof openConfirm === 'function') {
      openConfirm({
        title: 'Activate Tenant',
        message: "Are you sure you want to activate this tenant? This confirms payment has been received.",
        tone: 'warning',
        confirmLabel: 'Activate',
        cancelLabel: 'Cancel'
      }, doActivate);
    } else if (window.confirm("Are you sure you want to activate this tenant? This confirms payment has been received.")) {
      doActivate();
    }
  };

  const handleRenewTenant = async (tenant) => {
    const name = tenant?.business_name ? ` (${tenant.business_name})` : '';
    const doRenew = async () => {
      try {
        const res = await axios.put(`/api/admin/tenants/${tenant.id}/renew`);
        setTenants(prev => prev.map(t => t.id === tenant.id ? { ...t, is_active: 1, payment_status: 'approved', subscription_expiry: res.data?.new_expiry || t.subscription_expiry } : t));
        fetchData();
        emitToast("Subscription renewed successfully!", 'success');
      } catch (err) {
        emitToast("Error renewing subscription: " + (err.response?.data?.error || err.message), 'error');
      }
    };

    if (typeof openConfirm === 'function') {
      openConfirm({
        title: 'Renew Subscription',
        message: `Renew subscription${name}? This will extend expiry based on the tenant's current package duration.`,
        tone: 'info',
        confirmLabel: 'Renew',
        cancelLabel: 'Cancel'
      }, doRenew);
    } else if (window.confirm(`Renew subscription${name}? This will extend expiry.`)) {
      doRenew();
    }
  };

  const handleRejectReceipt = async (id) => {
    if (!rejectReason.trim()) {
      emitToast("Please enter a reason for rejecting the receipt.", 'warning');
      return;
    }
    try {
      await axios.put(`/api/admin/tenants/${id}/reject-receipt`, { reason: rejectReason.trim() });
      fetchData();
      setInspectingReceiptTenant(null);
      setShowRejectInput(false);
      setRejectReason('');
      emitToast("Payment receipt marked as rejected.", 'info');
    } catch (err) {
      emitToast("Error rejecting receipt: " + (err.response?.data?.error || err.message), 'error');
    }
  };

  const isTenantExpired = (tenant) => {
    if (!tenant?.subscription_expiry) return false;
    const d = new Date(tenant.subscription_expiry);
    if (Number.isNaN(d.getTime())) return false;
    return d < new Date();
  };

  const formatExpiry = (tenant) => {
    if (!tenant?.subscription_expiry) return '—';
    const d = new Date(tenant.subscription_expiry);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      if (editingTenantId) {
        await axios.put(`/api/admin/tenants/${editingTenantId}`, tenantForm);
        emitToast("Tenant updated successfully!", 'success');
      } else {
        await axios.post('/api/admin/tenants', tenantForm);
        emitToast("Tenant created successfully!", 'success');
      }
      setShowTenantModal(false);
      setTenantForm({ business_name: '', email: '', password: '', packageId: packages[0]?.id || '' });
      setEditingTenantId(null);
      fetchData();
    } catch (err) {
      emitToast(`Error ${editingTenantId ? 'updating' : 'creating'} tenant: ` + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleEditTenant = (tenant) => {
    // Find package ID by name
    const pkg = packages.find(p => p.name === tenant.plan);
    setTenantForm({
      business_name: tenant.business_name,
      email: tenant.email,
      password: '', // Leave blank to keep existing
      packageId: pkg ? pkg.id : (packages[0]?.id || '')
    });
    setEditingTenantId(tenant.id);
    setShowTenantModal(true);
  };

  const handleDeleteTenant = async (id) => {
    openConfirm({
      title: 'Delete Tenant',
      message: "Are you sure you want to DELETE this tenant? This action cannot be undone and will remove access immediately.",
      tone: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }, async () => {
      try {
        await axios.delete(`/api/admin/tenants/${id}`);
        fetchData();
        emitToast("Tenant deleted successfully!", 'success');
      } catch (err) {
        emitToast("Error deleting tenant: " + (err.response?.data?.error || err.message), 'error');
      }
    });
  };

  const handleSavePaymentInstructions = async (e) => {
    e.preventDefault();
    setPaymentSaving(true);
    try {
      await axios.put('/api/admin/payment-instructions', paymentForm);
      fetchData();
      emitToast("Payment instructions updated successfully!", 'success');
    } catch (err) {
      emitToast("Error updating payment instructions: " + (err.response?.data?.error || err.message), 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...packageForm,
        features: packageForm.features.split(',').map(f => f.trim())
      };
      
      if (editingPackageId) {
        await axios.put(`/api/packages/${editingPackageId}`, payload);
      } else {
        await axios.post('/api/packages', payload);
      }

      setShowPackageModal(false);
      setPackageForm({ name: '', price: '', duration_days: 30, features: '', ai_enabled: false, accounting_enabled: true, website_enabled: true, max_users: 1, extra_user_price: 5.00 });
      setEditingPackageId(null);
      fetchData(); // Refresh packages
    } catch (err) {
      emitToast("Error saving package: " + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleEditPackage = (pkg) => {
    // Helper to safely parse boolean from various formats (int, string, bool)
    const getBool = (val, defaultVal = false) => {
      if (val === undefined || val === null) return defaultVal;
      if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
      if (typeof val === 'number') return val === 1;
      return !!val;
    };

    setPackageForm({
      name: pkg.name,
      price: pkg.price,
      duration_days: pkg.duration_days,
      features: JSON.parse(pkg.features || '[]').join(', '),
      ai_enabled: getBool(pkg.ai_enabled, false),
      accounting_enabled: getBool(pkg.accounting_enabled, true),
      website_enabled: getBool(pkg.website_enabled, true),
      max_users: pkg.max_users || 1,
      extra_user_price: pkg.extra_user_price !== undefined && pkg.extra_user_price !== null ? Number(pkg.extra_user_price) : 5.00
    });
    setEditingPackageId(pkg.id);
    setShowPackageModal(true);
  };

  const handleDeletePackage = async (id) => {
    openConfirm({
      title: 'Delete Package',
      message: "Delete this package?",
      tone: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }, async () => {
      try {
        await axios.delete(`/api/packages/${id}`);
        fetchData();
      } catch (err) {
        console.error("Error deleting package", err);
        emitToast("Error deleting package: " + (err.response?.data?.error || err.message), 'error');
      }
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-lg font-medium text-slate-600">Loading Admin Panel...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top Header Navigation (Consistent with App.jsx) */}
      <header className="flex-none bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">FNF Admin</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">SUPER ADMIN</span>
          </div>
          <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <div className={`fixed md:static inset-0 top-16 bg-white md:bg-transparent md:flex md:items-center md:gap-2 p-4 md:p-0 transition-transform duration-200 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} z-30 border-r md:border-r-0 border-slate-200 md:w-auto w-64 shadow-xl md:shadow-none`}>
          <div className="md:hidden pb-4 mb-4 border-b border-slate-100">
             <div className="font-medium text-slate-900">Super Admin Console</div>
          </div>
          
          <button 
            className={`w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tenants' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => handleTabChange('tenants')}
          >
            <Users size={18} /> Tenants
          </button>
          
          <button 
            className={`w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'packages' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => handleTabChange('packages')}
          >
            <Package size={18} /> Packages
          </button>

          <button 
            className={`w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'payment' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={() => handleTabChange('payment')}
          >
            <Landmark size={18} /> Payment
          </button>

          <button className="w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-auto md:mt-0 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
        
        <div className="hidden md:flex items-center gap-3 pl-6 border-l border-slate-200">
           <div className="font-medium text-slate-900 text-sm">System Administrator</div>
           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">SA</div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'tenants' ? 'Business Tenants' : activeTab === 'packages' ? 'Subscription Packages' : 'Payment Details'}
            </h2>
            {activeTab !== 'payment' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all" onClick={() => {
                if (activeTab === 'tenants') {
                  setShowTenantModal(true);
                } else {
                  setEditingPackageId(null);
                  setPackageForm({ name: '', price: '', duration_days: 30, features: '', ai_enabled: false, accounting_enabled: true, website_enabled: true });
                  setShowPackageModal(true);
                }
              }}>
                <Plus size={18} />
                {activeTab === 'tenants' ? 'Add Tenant' : 'Add Package'}
              </button>
            )}
          </div>

          {activeTab === 'tenants' ? (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Filter:</span>
                <button
                  onClick={() => setTenantFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tenantFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  All ({tenants.length})
                </button>
                <button
                  onClick={() => setTenantFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tenantFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'}`}
                >
                  <AlertCircle size={13} />
                  Pending Approval ({tenants.filter(t => !t.is_active).length})
                </button>
                <button
                  onClick={() => setTenantFilter('receipts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tenantFilter === 'receipts' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
                >
                  <FileText size={13} />
                  Receipts to Verify ({tenants.filter(t => t.payment_receipt && t.payment_status === 'pending_approval').length})
                </button>
                <button
                  onClick={() => setTenantFilter('expired')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tenantFilter === 'expired' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}
                >
                  <AlertTriangle size={13} />
                  Expired ({tenants.filter(t => isTenantExpired(t)).length})
                </button>
                <button
                  onClick={() => setTenantFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${tenantFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                >
                  <CheckCircle size={13} />
                  Active ({tenants.filter(t => t.is_active && !isTenantExpired(t)).length})
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">ID</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Business Name</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Email</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Package</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Users & Seats</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Payment Receipt</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Expires</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Status</th>
                        <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants
                        .filter(tenant => {
                          if (tenantFilter === 'pending') return !tenant.is_active;
                          if (tenantFilter === 'receipts') return tenant.payment_receipt && tenant.payment_status === 'pending_approval';
                          if (tenantFilter === 'expired') return isTenantExpired(tenant);
                          if (tenantFilter === 'active') return tenant.is_active && !isTenantExpired(tenant);
                          return true;
                        })
                        .map(tenant => (
                        <tr key={tenant.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                          <td className="px-6 py-4 text-sm text-slate-500">#{tenant.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{tenant.business_name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{tenant.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{tenant.plan}</span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-semibold text-slate-800 text-xs">
                              {tenant.user_count || 0} Active / {tenant.max_users || 1} Incl.
                            </div>
                            {tenant.extra_users > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-200/60">
                                +{tenant.extra_users} Extra @ ${Number(tenant.extra_user_price || 5).toFixed(2)}/mo
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 block mt-0.5">Quota included</span>
                            )}
                          </td>
                          {/* Payment Receipt Column */}
                          <td className="px-6 py-4 text-sm">
                            {tenant.payment_receipt ? (
                              <div className="flex flex-col gap-1 items-start">
                                <button
                                  onClick={() => {
                                    setInspectingReceiptTenant(tenant);
                                    setShowRejectInput(false);
                                    setRejectReason('');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
                                >
                                  <FileText size={13} /> View Receipt
                                </button>
                                {tenant.payment_status === 'pending_approval' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse border border-amber-300">
                                    <AlertCircle size={10} /> Needs Review
                                  </span>
                                )}
                                {tenant.payment_status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full border border-green-300">
                                    <CheckCircle size={10} /> Verified
                                  </span>
                                )}
                                {tenant.payment_status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                                    <XCircle size={10} /> Rejected
                                  </span>
                                )}
                              </div>
                            ) : (
                              !tenant.is_active ? (
                                <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Awaiting Receipt
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatExpiry(tenant)}</td>
                          <td className="px-6 py-4 text-sm">
                            {(() => {
                              const expired = isTenantExpired(tenant);
                              if (expired) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                    <AlertTriangle size={12} /> Expired
                                  </span>
                                );
                              }
                              if (!tenant.is_active) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                    <XCircle size={12} /> Pending Approval
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                  <CheckCircle size={12} /> Active
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              {!tenant.is_active && (
                                <button 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-xs" 
                                  title="Approve & Activate Tenant" 
                                  onClick={() => handleActivateTenant(tenant.id)}
                                >
                                  <CheckCircle size={14} /> Approve
                                </button>
                              )}
                              {isTenantExpired(tenant) && (
                                <button 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs" 
                                  title="Approve Renewal" 
                                  onClick={() => handleRenewTenant(tenant)}
                                >
                                  <RefreshCw size={14} /> Renew
                                </button>
                              )}
                              <button className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Tenant" onClick={() => handleEditTenant(tenant)}>
                                <Edit size={16} />
                              </button>
                              <button className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Delete Tenant" onClick={() => handleDeleteTenant(tenant.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {tenants.length === 0 && <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-500 italic">No tenants found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receipt Inspection Modal */}
              {inspectingReceiptTenant && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                          <FileText size={20} className="text-blue-600" />
                          Offline Payment Proof Review
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inspectingReceiptTenant.business_name} ({inspectingReceiptTenant.email})
                        </p>
                      </div>
                      <button
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                        onClick={() => {
                          setInspectingReceiptTenant(null);
                          setShowRejectInput(false);
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Receipt Preview Area */}
                      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[300px] max-h-[460px] p-2 relative">
                        {inspectingReceiptTenant.payment_receipt?.toLowerCase().endsWith('.pdf') ? (
                          <div className="text-center p-6 text-white space-y-3">
                            <FileText size={48} className="mx-auto text-red-400" />
                            <p className="text-sm font-semibold">PDF Payment Receipt Attached</p>
                            <a
                              href={inspectingReceiptTenant.payment_receipt}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                              <ExternalLink size={14} /> Open Full PDF in New Tab
                            </a>
                          </div>
                        ) : (
                          <div className="relative group w-full h-full flex items-center justify-center">
                            <img
                              src={inspectingReceiptTenant.payment_receipt}
                              alt="Payment Proof"
                              className="max-h-[440px] max-w-full object-contain rounded-lg"
                            />
                            <a
                              href={inspectingReceiptTenant.payment_receipt}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm transition-all"
                            >
                              <ExternalLink size={12} /> Full Screen
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Payment & Transfer Meta */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-semibold block mb-1">Transfer Notes / Sender Info:</span>
                          <p className="font-bold text-slate-800 text-sm">{inspectingReceiptTenant.payment_notes || 'No note provided'}</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-semibold block mb-1">Submission Date:</span>
                          <p className="font-bold text-slate-800 text-sm">
                            {inspectingReceiptTenant.receipt_uploaded_at ? new Date(inspectingReceiptTenant.receipt_uploaded_at).toLocaleString() : 'Recently uploaded'}
                          </p>
                        </div>
                      </div>

                      {/* Reject Reason Form (Conditional) */}
                      {showRejectInput && (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-3 animate-in fade-in">
                          <label className="block text-xs font-bold text-red-900">Reason for Rejecting Receipt:</label>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Unreadable receipt, amount does not match, fake reference"
                            className="w-full px-3 py-2 text-xs border border-red-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowRejectInput(false)}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReceipt(inspectingReceiptTenant.id)}
                              className="px-4 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                      {!showRejectInput ? (
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(true)}
                          className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                        >
                          Reject Proof
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectingReceiptTenant(null);
                            setShowRejectInput(false);
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Close
                        </button>

                        {!inspectingReceiptTenant.is_active && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const targetId = inspectingReceiptTenant.id;
                                const res = await axios.put(`/api/admin/tenants/${targetId}/activate`);
                                setTenants(prev => prev.map(t => t.id === targetId ? { ...t, is_active: 1, payment_status: 'approved', subscription_expiry: res.data?.new_expiry || t.subscription_expiry } : t));
                                fetchData();
                                setInspectingReceiptTenant(null);
                                emitToast("Tenant approved and activated successfully!", 'success');
                              } catch (err) {
                                emitToast("Error activating tenant: " + (err.response?.data?.error || err.message), 'error');
                              }
                            }}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-200 transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle size={14} /> Approve & Activate Account
                          </button>
                        )}

                        {isTenantExpired(inspectingReceiptTenant) && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const targetId = inspectingReceiptTenant.id;
                                const res = await axios.put(`/api/admin/tenants/${targetId}/renew`);
                                setTenants(prev => prev.map(t => t.id === targetId ? { ...t, is_active: 1, payment_status: 'approved', subscription_expiry: res.data?.new_expiry || t.subscription_expiry } : t));
                                fetchData();
                                setInspectingReceiptTenant(null);
                                emitToast("Subscription renewed successfully!", 'success');
                              } catch (err) {
                                emitToast("Error renewing subscription: " + (err.response?.data?.error || err.message), 'error');
                              }
                            }}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
                          >
                            <RefreshCw size={14} /> Approve & Renew Subscription
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'packages' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="p-6 border-b border-slate-100">
                     <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                     <p className="text-2xl font-bold text-slate-900 mt-2">${pkg.price} <span className="text-sm font-medium text-slate-400">/ {pkg.duration_days} days</span></p>
                  </div>
                  
                  <div className="p-6 flex-1 space-y-3">
                    <div className="flex items-start gap-3 text-sm text-slate-700 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                      <Users size={16} className="shrink-0 mt-0.5 text-blue-600" />
                      <div className="text-xs">
                        <span className="font-bold text-blue-900">{pkg.max_users || 1} User Accounts</span> included
                        <div className="text-slate-500 mt-0.5">+${pkg.extra_user_price !== undefined ? Number(pkg.extra_user_price).toFixed(2) : '5.00'}/mo per extra user</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle size={16} className={`shrink-0 mt-0.5 ${pkg.ai_enabled ? 'text-indigo-500' : 'text-slate-300'}`} /> 
                      <span className={`leading-tight ${pkg.ai_enabled ? 'text-indigo-900 font-medium' : 'text-slate-400 line-through'}`}>AI Features</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle size={16} className={`shrink-0 mt-0.5 ${pkg.accounting_enabled ? 'text-emerald-500' : 'text-slate-300'}`} /> 
                      <span className={`leading-tight ${pkg.accounting_enabled ? 'text-emerald-900 font-medium' : 'text-slate-400 line-through'}`}>Accounting Suite</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle size={16} className={`shrink-0 mt-0.5 ${pkg.website_enabled ? 'text-blue-500' : 'text-slate-300'}`} /> 
                      <span className={`leading-tight ${pkg.website_enabled ? 'text-blue-900 font-medium' : 'text-slate-400 line-through'}`}>Website Storefront</span>
                    </div>
                    {JSON.parse(pkg.features || '[]').map((f, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" /> 
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm" onClick={() => handleEditPackage(pkg)}>
                       Edit
                    </button>
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDeletePackage(pkg.id)}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <form onSubmit={handleSavePaymentInstructions}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name</label>
                    <input type="text" value={paymentForm.bankName} onChange={e => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Title</label>
                    <input type="text" value={paymentForm.accountTitle} onChange={e => setPaymentForm(prev => ({ ...prev, accountTitle: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                    <input type="text" value={paymentForm.accountNumber} onChange={e => setPaymentForm(prev => ({ ...prev, accountNumber: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">IBAN</label>
                    <input type="text" value={paymentForm.iban} onChange={e => setPaymentForm(prev => ({ ...prev, iban: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                    <input type="text" value={paymentForm.branch} onChange={e => setPaymentForm(prev => ({ ...prev, branch: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                    <input type="email" value={paymentForm.email} onChange={e => setPaymentForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium" onClick={fetchData}>Reset</button>
                  <button type="submit" disabled={paymentSaving} className={`px-4 py-2 text-white font-medium rounded-lg shadow-sm transition-colors ${paymentSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {paymentSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Tenant Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">{editingTenantId ? 'Edit Tenant' : 'Add New Tenant'}</h2>
                <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => { setShowTenantModal(false); setEditingTenantId(null); setTenantForm({ business_name: '', email: '', password: '', packageId: packages[0]?.id || '' }); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateTenant}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                    <input type="text" value={tenantForm.business_name} onChange={e => setTenantForm({...tenantForm, business_name: e.target.value})} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={tenantForm.email} onChange={e => setTenantForm({...tenantForm, email: e.target.value})} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password {editingTenantId && <span className="text-xs text-slate-400 font-normal">(Leave blank to keep current)</span>}</label>
                    <input type="text" value={tenantForm.password} onChange={e => setTenantForm({...tenantForm, password: e.target.value})} required={!editingTenantId} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Package</label>
                    <select value={tenantForm.packageId} onChange={e => setTenantForm({...tenantForm, packageId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white">
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium" onClick={() => { setShowTenantModal(false); setEditingTenantId(null); setTenantForm({ business_name: '', email: '', password: '', packageId: packages[0]?.id || '' }); }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">{editingTenantId ? 'Update Tenant' : 'Create Tenant'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">{editingPackageId ? 'Edit Package' : 'New Package'}</h2>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowPackageModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreatePackage}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Package Name</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={packageForm.name} onChange={e => setPackageForm({...packageForm, name: e.target.value})} required placeholder="e.g. Gold Plan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price ($ USD)</label>
                  <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: e.target.value})} required placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                  <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={packageForm.duration_days} onChange={e => setPackageForm({...packageForm, duration_days: e.target.value})} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Included Users (Seats)</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                      value={packageForm.max_users} 
                      onChange={e => setPackageForm({...packageForm, max_users: Math.max(1, parseInt(e.target.value) || 1)})} 
                      required 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Staff accounts included in this plan tier.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Extra User Fee ($/mo)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                      value={packageForm.extra_user_price} 
                      onChange={e => setPackageForm({...packageForm, extra_user_price: parseFloat(e.target.value) || 0})} 
                      required 
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Extra charge per user beyond included limit.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <input 
                      type="checkbox" 
                      id="ai_enabled"
                      checked={packageForm.ai_enabled}
                      onChange={e => setPackageForm({...packageForm, ai_enabled: e.target.checked})}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="ai_enabled" className="text-sm font-medium text-indigo-900 cursor-pointer select-none flex-1">
                      Enable AI Features (Sales Co-Pilot & Voice Commands)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <input 
                      type="checkbox" 
                      id="accounting_enabled"
                      checked={packageForm.accounting_enabled}
                      onChange={e => setPackageForm({...packageForm, accounting_enabled: e.target.checked})}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="accounting_enabled" className="text-sm font-medium text-emerald-900 cursor-pointer select-none flex-1">
                      Enable Accounting (Receivables, Payables, Customers, Vendors)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <input 
                      type="checkbox" 
                      id="website_enabled"
                      checked={packageForm.website_enabled}
                      onChange={e => setPackageForm({...packageForm, website_enabled: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="website_enabled" className="text-sm font-medium text-blue-900 cursor-pointer select-none flex-1">
                      Enable Website Storefront (CMS & Public Access)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Features (Comma separated)</label>
                  <textarea 
                    value={packageForm.features} 
                    onChange={e => setPackageForm({...packageForm, features: e.target.value})} 
                    placeholder="Unlimited POS, 24/7 Support, Cloud Backup"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50">
                <button type="button" className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors" onClick={() => setShowPackageModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">{editingPackageId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}
      
      {/* Using global App confirm modal via openConfirm */}
    </div>
  );
}

export default SuperAdminView;
