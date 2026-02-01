import React, { useState, useEffect } from 'react';
import axios from './api';
import { Users, Package, Trash2, Plus, LogOut, CheckCircle, XCircle, Menu, X, LayoutDashboard } from 'lucide-react';
import './App.css';

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

  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    duration_days: 30,
    features: '' // comma separated
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
      
      if (editingPackageId) {
        await axios.put(`/api/packages/${editingPackageId}`, payload);
      } else {
        await axios.post('/api/packages', payload);
      }

      setShowPackageModal(false);
      setPackageForm({ name: '', price: '', duration_days: 30, features: '' });
      setEditingPackageId(null);
      fetchData(); // Refresh packages
    } catch (err) {
      alert("Error saving package: " + (err.response?.data?.error || err.message));
    }
  };

  const handleEditPackage = (pkg) => {
    setPackageForm({
      name: pkg.name,
      price: pkg.price,
      duration_days: pkg.duration_days,
      features: JSON.parse(pkg.features || '[]').join(', ')
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
      alert("Error deleting package");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (loading) return <div className="loading-screen">Loading Admin Panel...</div>;

  return (
    <div className="app-container">
      {/* Top Header Navigation (Consistent with App.jsx) */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-area">
            <h1>FNF Admin</h1>
            <span className="status-badge">SUPER ADMIN</span>
          </div>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <div className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="mobile-user-info">
             <div className="user-welcome">Super Admin Console</div>
          </div>
          
          <button 
            className={`nav-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            onClick={() => handleTabChange('tenants')}
          >
            <Users size={18} /> Tenants
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => handleTabChange('packages')}
          >
            <Package size={18} /> Packages
          </button>

          <button className="nav-btn logout-btn" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
        
        <div className="header-user desktop-only">
           <div className="user-welcome">System Administrator</div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-content">
        <div className="page-header">
          <h2>
            {activeTab === 'tenants' ? 'Business Tenants' : 'Subscription Packages'}
          </h2>
          <button className="primary-btn" onClick={() => {
            if (activeTab === 'tenants') {
              setShowTenantModal(true);
            } else {
              setEditingPackageId(null);
              setPackageForm({ name: '', price: '', duration_days: 30, features: '' });
              setShowPackageModal(true);
            }
          }}>
            <Plus size={18} />
            {activeTab === 'tenants' ? 'Add Tenant' : 'Add Package'}
          </button>
        </div>

        {activeTab === 'tenants' ? (
          <div className="card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Business Name</th>
                    <th>Email</th>
                    <th>Package</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
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
                          <span className="badge badge-success"><CheckCircle size={12} style={{marginRight:4}}/> Active</span> : 
                          <span className="badge badge-danger"><XCircle size={12} style={{marginRight:4}}/> Pending</span>
                        }
                      </td>
                      <td>
                        {!tenant.is_active && (
                          <button className="action-btn success" title="Activate Tenant" onClick={() => handleActivateTenant(tenant.id)}>
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No tenants found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid-container">
            {packages.map(pkg => (
              <div key={pkg.id} className="card product-card">
                <div className="card-header">
                   <h3>{pkg.name}</h3>
                   <p className="price-tag">PKR {pkg.price} <span>/ {pkg.duration_days} days</span></p>
                </div>
                
                <div className="card-body">
                  {JSON.parse(pkg.features || '[]').map((f, i) => (
                    <div key={i} className="feature-item">
                      <CheckCircle size={14} color="var(--success-color)" /> {f}
                    </div>
                  ))}
                </div>
                
                <div className="card-actions">
                  <button className="secondary-btn" onClick={() => handleEditPackage(pkg)}>
                     Edit
                  </button>
                  <button className="action-btn danger" onClick={() => handleDeletePackage(pkg.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {showTenantModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Tenant</h2>
              <button className="close-btn" onClick={() => setShowTenantModal(false)}><X size={20} /></button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <form onSubmit={handleCreateTenant}>
                <div className="form-group">
                  <label>Business Name</label>
                  <input type="text" value={tenantForm.business_name} onChange={e => setTenantForm({...tenantForm, business_name: e.target.value})} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={tenantForm.email} onChange={e => setTenantForm({...tenantForm, email: e.target.value})} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="text" value={tenantForm.password} onChange={e => setTenantForm({...tenantForm, password: e.target.value})} required className="form-control" />
                </div>
                <div className="form-group">
                  <label>Package</label>
                  <select value={tenantForm.packageId} onChange={e => setTenantForm({...tenantForm, packageId: e.target.value})} className="form-control">
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (PKR {p.price})</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="secondary-btn" onClick={() => setShowTenantModal(false)}>Cancel</button>
                  <button type="submit" className="primary-btn">Create Tenant</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showPackageModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingPackageId ? 'Edit Package' : 'New Package'}</h2>
              <button className="close-btn" onClick={() => setShowPackageModal(false)}><X size={20} /></button>
            </div>
            <div style={{padding: '1.5rem'}}>
              <form onSubmit={handleCreatePackage}>
                <div className="form-group">
                  <label>Package Name</label>
                  <input type="text" value={packageForm.name} onChange={e => setPackageForm({...packageForm, name: e.target.value})} required placeholder="e.g. Gold Plan" />
                </div>
                <div className="form-group">
                  <label>Price (PKR)</label>
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
                    style={{width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontFamily: 'inherit'}}
                    rows="3"
                  />
                </div>
                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem'}}>
                  <button type="button" className="secondary-btn" onClick={() => setShowPackageModal(false)}>Cancel</button>
                  <button type="submit" className="primary-btn">{editingPackageId ? 'Update' : 'Create'}</button>
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