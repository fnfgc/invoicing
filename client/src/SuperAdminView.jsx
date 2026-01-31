import React, { useState, useEffect } from 'react';
import axios from './api';
import { Users, CreditCard, Activity, Calendar, CheckCircle, XCircle } from 'lucide-react';
import './App.css'; // Reusing styles

function SuperAdminView({ onLogout }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Tenant Form
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    password: '',
    plan: 'monthly'
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await axios.get('/api/admin/tenants');
      setTenants(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
      alert("Failed to load tenants. Are you logged in as Super Admin?");
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/tenants', formData);
      setShowModal(false);
      setFormData({ business_name: '', email: '', password: '', plan: 'monthly' });
      fetchTenants();
      alert("Tenant created successfully!");
    } catch (err) {
      alert("Error creating tenant: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="loading">Loading Admin Panel...</div>;

  return (
    <div className="app-container">
      {/* Sidebar (Simplified) */}
      <div className="sidebar" style={{width: '250px'}}>
        <div className="logo-area">
          <h2>FNF Admin</h2>
          <div className="user-info">
            <small>Super Admin</small>
          </div>
        </div>
        <div className="nav-items">
          <div className="nav-item active">
            <Users size={20} />
            <span>Manage Tenants</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <h1>SaaS Management</h1>
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            + New Tenant / Business
          </button>
        </header>

        <div className="content-area">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Business Name</th>
                  <th>Email / Login</th>
                  <th>Plan</th>
                  <th>Subscription Expiry</th>
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
                      <span className={`badge badge-${tenant.plan === 'yearly' ? 'success' : 'info'}`}>
                        {tenant.plan.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(tenant.subscription_expiry).toLocaleDateString()}</td>
                    <td>
                      {tenant.is_active ? 
                        <span style={{color: 'green', display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <CheckCircle size={14} /> Active
                        </span> : 
                        <span style={{color: 'red', display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <XCircle size={14} /> Inactive
                        </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Business Tenant</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><XCircle /></button>
            </div>
            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label>Business Name</label>
                <input 
                  type="text" 
                  value={formData.business_name} 
                  onChange={e => setFormData({...formData, business_name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email (Login Username)</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="text" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Subscription Plan</label>
                <select 
                  value={formData.plan} 
                  onChange={e => setFormData({...formData, plan: e.target.value})}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminView;
