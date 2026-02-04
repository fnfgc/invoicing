import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Search, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import api from './api';

function ReportsView() {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError(t('select_dates_error') || 'Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const res = await api.get('/api/reports/transactions', {
        params: { startDate, endDate }
      });
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to fetch report", err);
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
            <FileText size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('transaction_report') || 'Transaction Report'}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Filter Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-slate-500" />
              {t('date_range') || 'Date Range'}
            </h3>
            <form onSubmit={handleGenerateReport} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('start_date') || 'Start Date'}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('end_date') || 'End Date'}</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <Search size={18} />
                )}
                {t('generate') || 'Generate'}
              </button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-500 mb-1">{t('total_transactions') || 'Total Transactions'}</p>
                  <p className="text-3xl font-bold text-slate-900">{reportData.count}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-full text-indigo-600 relative z-10">
                  <FileText size={32} />
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center justify-between relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-500 mb-1">{t('total_revenue') || 'Total Revenue'}</p>
                  <p className="text-3xl font-bold text-slate-900">PKR {Number(reportData.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-full text-emerald-600 relative z-10">
                  <DollarSign size={32} />
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
              </div>
            </div>
          )}
          
           {/* Info Note */}
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700 flex gap-3">
              <div className="shrink-0 pt-0.5"><AlertTriangle size={16} /></div>
              <p>This report shows all transactions within the selected date range. All amounts are in PKR.</p>
           </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
