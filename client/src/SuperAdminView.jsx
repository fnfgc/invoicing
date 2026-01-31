import React, { useState, useEffect } from 'react';
import axios from './api';
import { Users, CreditCard, Activity, Calendar, CheckCircle, XCircle, Package, Trash2, Plus, LogOut } from 'lucide-react';
import './App.css';

function SuperAdminView({ onLogout }) {
  const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' | 'packages'
  const [tenants, setTenants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    duration_days: 30,
    features: '' // comma separated
  });

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

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/tenants', tenantForm);
      setShowTenantModal(false);
      setTenantForm({ business_name: '', email: '', password: '', packageId: packages[0]?.id || '' });
      fetchData();
      alert("Tenant created successfully!");
    } catch (err) {
      alert("Error creating tenant: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...packageForm,
        features: packageForm.features.split(',').map(f => f.trim())
      };
      await axios.post('/api/packages', payload);
      setShowPackageModal(false);
      setPackageForm({ name: '', price: '', duration_days: 30, features: '' });
      fetchData(); // Refresh packages
    } catch (err) {
      alert("Error creating package: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await axios.delete(`/api/packages/${id}`);
      fetchData();
    } catch (err) {
      alert("Error deleting package");
    }
  };

  if (loading) return <div className="loading-screen">Loading Admin Panel...</div>;

  return (
    <div className="app-container" style={{ flexDirection: 'row' }}>
      {/* Sidebar */}
      <div className="sidebar" style={{width: '260px'}}>
        <div className="logo-area">
          <h2>FNF Admin</h2>
          <div className="user-info">
            <small style={{opacity: 0.7}}>Super Admin Console</small>
          </div>
        </div>
        
        <div className="nav-items">
          <div 
            className={`nav-item ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenants')}
          >
            <Users size={20} />
            <span>Manage Tenants</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            <Package size={20} />
            <span>Subscription Packages</span>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout} style={{marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '1rem'}}>
          <LogOut size={20} /> Log Out
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <h1>{activeTab === 'tenants' ? 'Business Tenants' : 'Subscription Packages'}</h1>
          <button className="primary-btn" onClick={() => activeTab === 'tenants' ? setShowTenantModal(true) : setShowPackageModal(true)}>
            <Plus size={18} style={{marginRight: '8px'}} />
            {activeTab === 'tenants' ? 'New Tenant' : 'New Package'}
          </button>
        </header>

        <div className="content-area">
          {activeTab === 'tenants' ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Business Name</th>
                    <th>Email</th>
                    <th>Package</th>
                    <th>Expires</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(tenant => (
                    <tr key={tenant.id}>
                      <td>#{tenant.id}</td>
                      <td>{tenant.business_name}</td>
                      <td>{tenant.email}</td>
                      <td>
                        <span className="badge badge-info">{tenant.plan}</span>
                      </td>
                      <td>{new Date(tenant.subscription_expiry).toLocaleDateString()}</td>
                      <td>
                        {tenant.is_active ? 
                          <span style={{color: 'green', display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle size={14} /> Active</span> : 
                          <span style={{color: 'red', display: 'flex', alignItems: 'center', gap: '4px'}}><XCircle size={14} /> Inactive</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No tenants found.</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="products-grid">
              {packages.map(pkg => (
                <div key={pkg.id} className="product-card" style={{cursor: 'default'}}>
                  <h3>{pkg.name}</h3>
                  <p className="product-price">${pkg.price} <small style={{fontSize: '0.8rem', color: '#666'}}>/ {pkg.duration_days} days</small></p>
                  <div style={{margin: '1rem 0', flex: 1}}>
                    {JSON.parse(pkg.features || '[]').map((f, i) => (
                      <div key={i} style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', marginBottom: '5px'}}>
                        <CheckCircle size={14} color="green" /> {f}
                      </div>
                    ))}
                  </div>
                  <button className="remove-btn" onClick={() => handleDeletePackage(pkg.id)} style={{width: '100%', marginTop: '10px'}}>
                    <Trash2 size={16} /> Delete Package
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showTenantModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Tenant</h3>
              <button className="close-btn" onClick={() => setShowTenantModal(false)}><XCircle /></button>
            </div>
            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label>Business Name</label>
                <input type="text" value={tenantForm.business_name} onChange={e => setTenantForm({...tenantForm, business_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={tenantForm.email} onChange={e => setTenantForm({...tenantForm, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="text" value={tenantForm.password} onChange={e => setTenantForm({...tenantForm, password: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Package</label>
                <select value={tenantForm.packageId} onChange={e => setTenantForm({...tenantForm, packageId: e.target.value})}>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" className="secondary-btn" onClick={() => setShowTenantModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showPackageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Subscription Package</h3>
              <button className="close-btn" onClick={() => setShowPackageModal(false)}><XCircle /></button>
            </div>
            <form onSubmit={handleCreatePackage}>
              <div className="form-group">
                <label>Package Name</label>
                <input type="text" value={packageForm.name} onChange={e => setPackageForm({...packageForm, name: e.target.value})} required placeholder="e.g. Gold Plan" />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input type="number" value={packageForm.price} onChange={e => setPackageForm({...packageForm, price: e.target.value})} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Duration (Days)</label>
                <input type="number" value={packageForm.duration_days} onChange={e => setPackageForm({...packageForm, duration_days: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Features (Comma separated)</label>
                <textarea 
                  value={packageForm.features} 
                  onChange={e => setPackageForm({...packageForm, features: e.target.value})} 
                  placeholder="Unlimited POS, 24/7 Support, Cloud Backup"
                  style={{width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd'}}
                  rows="3"
                />
              </div>
              <div className="modal-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <button type="button" className="secondary-btn" onClick={() => setShowPackageModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Create Package</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminView;
