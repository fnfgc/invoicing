import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from './api';
import { Users, Plus, Edit3, AlertTriangle } from 'lucide-react';

function PartnersView({ type }) {
  const { t } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    taxNumber: '',
    address: ''
  });

  const title = type === 'customer' ? (t('customers') || 'Customers') : (t('vendors') || 'Vendors');

  const loadPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/partners', { params: { type } });
      setPartners(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, [type]);

  const openNew = () => {
    setEditingPartner(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      taxNumber: '',
      address: ''
    });
    setShowModal(true);
  };

  const openEdit = (partner) => {
    setEditingPartner(partner);
    setForm({
      name: partner.name || '',
      email: partner.email || '',
      phone: partner.phone || '',
      taxNumber: partner.taxNumber || '',
      address: partner.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingPartner) {
        await api.put(`/api/partners/${editingPartner.id}`, {
          ...form,
          type
        });
      } else {
        await api.post('/api/partners', {
          ...form,
          type
        });
      }
      setShowModal(false);
      setEditingPartner(null);
      await loadPartners();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save partner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-8 overflow-y-auto flex-1">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          onClick={openNew}
        >
          <Plus size={18} />
          {type === 'customer' ? (t('add_customer') || 'Add Customer') : (t('add_vendor') || 'Add Vendor')}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('name') || 'Name'}</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('email') || 'Email'}</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('phone') || 'Phone'}</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('tax') || 'Tax #'}</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{t('address') || 'Address'}</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-400">
                    {loading ? 'Loading...' : t('no_data') || 'No records yet'}
                  </td>
                </tr>
              ) : (
                partners.map(p => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-800 font-semibold">{p.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{p.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{p.phone}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{p.taxNumber}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      <span className="line-clamp-2">{p.address}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-right">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        onClick={() => openEdit(p)}
                      >
                        <Edit3 size={14} />
                        {t('edit') || 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditingPartner(null); }}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingPartner
                    ? type === 'customer'
                      ? t('edit_customer') || 'Edit Customer'
                      : t('edit_vendor') || 'Edit Vendor'
                    : type === 'customer'
                    ? t('add_customer') || 'Add Customer'
                    : t('add_vendor') || 'Add Vendor'}
                </h2>
                <button className="text-gray-500 hover:text-gray-700 transition-colors" onClick={() => { setShowModal(false); setEditingPartner(null); }}>
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('name') || 'Name'}</label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('email') || 'Email'}</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone') || 'Phone'}</label>
                      <input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('tax') || 'Tax Number'}</label>
                    <input
                      value={form.taxNumber}
                      onChange={e => setForm({ ...form, taxNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('address') || 'Address'}</label>
                    <textarea
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => { setShowModal(false); setEditingPartner(null); }}
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

export default PartnersView;

