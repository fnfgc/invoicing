import React, { useState, useEffect } from 'react';
import axios from './api';
import { Users, Package, Trash2, Plus, LogOut, CheckCircle, XCircle, Menu, X, Edit } from 'lucide-react';
import './index.css';

function SuperAdminView({ onLogout }) {
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'packages'
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

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
    website_enabled: true
  });
  const [editingPackageId, setEditingPackageId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, packagesRes] = await Promise.all([
        axios.get('/api/admin/tenants'),
        axios.get('/api/packages')
      ]);
      setTenants(tenantsRes.data);
      setPackages(packagesRes.data);
      
      // Set default package selection
      if (packagesRes.data.length > 0) {
        setTenantForm(prev => ({ ...prev, packageId: packagesRes.data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTenant = async (id) => {
    if (!window.confirm("Are you sure you want to activate this tenant? This confirms payment has been received.")) return;
    try {
      await axios.put(`/api/admin/tenants/${id}/activate`);
      fetchData();
      alert("Tenant activated successfully!");
    } catch (err) {
      alert("Error activating tenant: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      if (editingTenantId) {
        await axios.put(`/api/admin/tenants/${editingTenantId}`, tenantForm);
        alert("Tenant updated successfully!");
      } else {
        await axios.post('/api/admin/tenants', tenantForm);
        alert("Tenant created successfully!");
      }
      setShowTenantModal(false);
      setTenantForm({ business_name: '', email: '', password: '', packageId: packages[0]?.id || '' });
      setEditingTenantId(null);
      fetchData();
    } catch (err) {
      alert(`Error ${editingTenantId ? 'updating' : 'creating'} tenant: ` + (err.response?.data?.error || err.message));
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
    if (!window.confirm("Are you sure you want to DELETE this tenant? This action cannot be undone and will remove access immediately.")) return;
    try {
      await axios.delete(`/api/admin/tenants/${id}`);
      fetchData();
      alert("Tenant deleted successfully!");
    } catch (err) {
      alert("Error deleting tenant: " + (err.response?.data?.error || err.message));
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
      setPackageForm({ name: '', price: '', duration_days: 30, features: '', ai_enabled: false, accounting_enabled: true, website_enabled: true });
      setEditingPackageId(null);
      fetchData(); // Refresh packages
    } catch (err) {
      alert("Error saving package: " + (err.response?.data?.error || err.message));
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
      website_enabled: getBool(pkg.website_enabled, true)
    });
    setEditingPackageId(pkg.id);
    setShowPackageModal(true);
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await axios.delete(`/api/packages/${id}`);
      fetchData();
    } catch (err) {
      console.error("Error deleting package", err);
      alert("Error deleting package: " + (err.response?.data?.error || err.message));
    }
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
              {activeTab === 'tenants' ? 'Business Tenants' : 'Subscription Packages'}
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all" onClick={() => {
              if (activeTab === 'tenants') {
                setShowTenantModal(true);
              } else {
                setEditingPackageId(null);
                setPackageForm({ name: '', price: '', duration_days: 30, features: '', ai_enabled: false });
                setShowPackageModal(true);
              }
            }}>
              <Plus size={18} />
              {activeTab === 'tenants' ? 'Add Tenant' : 'Add Package'}
            </button>
          </div>

          {activeTab === 'tenants' ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">ID</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Business Name</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Email</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Package</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Expires</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Status</th>
                      <th className="border-b border-slate-100 px-6 py-4 text-xs font-semibold uppercase text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(tenant => (
                      <tr key={tenant.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                        <td className="px-6 py-4 text-sm text-slate-500">#{tenant.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{tenant.business_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{tenant.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{tenant.plan}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(tenant.subscription_expiry).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm">
                          {tenant.is_active ? 
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"><CheckCircle size={12} /> Active</span> : 
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700"><XCircle size={12} /> Pending</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          {!tenant.is_active && (
                            <button className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Activate Tenant" onClick={() => handleActivateTenant(tenant.id)}>
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Tenant" onClick={() => handleEditTenant(tenant)}>
                            <Edit size={18} />
                          </button>
                          <button className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Delete Tenant" onClick={() => handleDeleteTenant(tenant.id)}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 italic">No tenants found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="p-6 border-b border-slate-100">
                     <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                     <p className="text-2xl font-bold text-slate-900 mt-2">PKR {pkg.price} <span className="text-sm font-medium text-slate-400">/ {pkg.duration_days} days</span></p>
                  </div>
                  
                  <div className="p-6 flex-1 space-y-3">
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
                        <option key={p.id} value={p.id}>{p.name} (PKR {p.price})</option>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (PKR)</label>
                  <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: e.target.value})} required placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Days)</label>
                  <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" value={packageForm.duration_days} onChange={e => setPackageForm({...packageForm, duration_days: e.target.value})} required />
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
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <input 
                    type="checkbox" 
                    id="ai_enabled"
                    checked={packageForm.ai_enabled}
                    onChange={e => setPackageForm({...packageForm, ai_enabled: e.target.checked})}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="ai_enabled" className="text-sm font-medium text-indigo-900 cursor-pointer select-none">
                    Enable AI Features (Sales Co-Pilot & Voice Commands)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <input 
                    type="checkbox" 
                    id="accounting_enabled"
                    checked={packageForm.accounting_enabled}
                    onChange={e => setPackageForm({...packageForm, accounting_enabled: e.target.checked})}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                  />
                  <label htmlFor="accounting_enabled" className="text-sm font-medium text-emerald-900 cursor-pointer select-none">
                    Enable Accounting (Receivables, Payables, Customers, Vendors)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <input 
                    type="checkbox" 
                    id="website_enabled"
                    checked={packageForm.website_enabled}
                    onChange={e => setPackageForm({...packageForm, website_enabled: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="website_enabled" className="text-sm font-medium text-blue-900 cursor-pointer select-none">
                    Enable Website (Public Storefront)
                  </label>
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
    </div>
  );
}

export default SuperAdminView;
