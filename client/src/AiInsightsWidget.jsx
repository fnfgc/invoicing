import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Package, ShoppingBag, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import api from './api';

const emitToast = (message, type = 'info', duration = 3500) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }));
};

function AiInsightsWidget() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/ai-insights');
            setInsights(res.data);
        } catch (err) {
            console.error("Failed to fetch AI insights", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    if (!insights && loading) return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
            <div className="h-6 bg-slate-100 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-50 rounded-xl"></div>)}
            </div>
        </div>
    );

    if (!insights) return null;

    if (insights.locked) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-400 text-white rounded-lg shadow-lg">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">AI Sales Co-Pilot</h3>
                            <p className="text-xs text-slate-500">Unlock real-time business intelligence</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Locked
                    </div>
                </div>
                
                <div className="relative z-10 bg-white/60 backdrop-blur-sm rounded-xl p-8 text-center border border-slate-200">
                    <Sparkles size={48} className="mx-auto text-indigo-300 mb-4" />
                    <h4 className="text-xl font-bold text-slate-800 mb-2">Upgrade to Pro for AI Insights</h4>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">Get real-time stock alerts, smart bundling suggestions, and sales trend analysis to grow your business.</p>
                    <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200" onClick={() => emitToast("Please contact support to upgrade your plan.", 'info')}>
                        Upgrade Plan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100 mb-8 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">AI Sales Co-Pilot</h3>
                        <p className="text-xs text-slate-500">Real-time business intelligence</p>
                    </div>
                </div>
                <button 
                    onClick={fetchInsights} 
                    disabled={loading}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {/* 1. Sales Trend */}
                {insights.salesTrend && (
                    <div className={`p-4 rounded-xl border ${insights.salesTrend.trend === 'up' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} transition-all hover:shadow-md`}>
                        <div className="flex items-center gap-2 mb-2">
                            {insights.salesTrend.trend === 'up' ? <TrendingUp size={18} className="text-emerald-600" /> : <TrendingDown size={18} className="text-rose-600" />}
                            <span className={`text-xs font-bold uppercase tracking-wider ${insights.salesTrend.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>Sales Velocity</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-800 mb-1">{insights.salesTrend.value}</div>
                        <p className="text-xs text-slate-600 leading-relaxed">{insights.salesTrend.message}</p>
                    </div>
                )}

                {/* 2. Stock Alerts */}
                {insights.stockAlerts && insights.stockAlerts.length > 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={18} className="text-amber-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Stock Risk</span>
                        </div>
                        <div className="space-y-2">
                            {insights.stockAlerts.slice(0, 2).map((alert, idx) => (
                                <div key={idx} className="text-xs text-slate-700 pb-2 border-b border-amber-100 last:border-0 last:pb-0">
                                    <p className="font-medium mb-0.5">{alert.message}</p>
                                    <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">{alert.action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
                        <CheckCircle size={24} className="text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">Inventory looks healthy</p>
                    </div>
                )}

                {/* 3. Bundling */}
                {insights.bundling && insights.bundling.length > 0 ? (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag size={18} className="text-blue-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Smart Bundle</span>
                        </div>
                        {insights.bundling.slice(0, 1).map((bundle, idx) => (
                            <div key={idx}>
                                <p className="text-sm font-semibold text-slate-800 mb-1">Bundle Opportunity</p>
                                <p className="text-xs text-slate-600 mb-2">{bundle.message}</p>
                                <div className="p-2 bg-blue-100 rounded-lg text-xs text-blue-700 font-medium">
                                    💡 {bundle.suggestion}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
                        <Package size={24} className="text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">No bundle patterns yet</p>
                    </div>
                )}

                {/* 4. Pricing Tips */}
                {insights.pricingTips && insights.pricingTips.length > 0 ? (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 transition-all hover:shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                            <Lightbulb size={18} className="text-purple-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Profit Insight</span>
                        </div>
                        {insights.pricingTips.slice(0, 1).map((tip, idx) => (
                            <div key={idx}>
                                <p className="text-sm font-semibold text-slate-800 mb-1">High Demand</p>
                                <p className="text-xs text-slate-600 mb-2">{tip.message}</p>
                                <div className="p-2 bg-purple-100 rounded-lg text-xs text-purple-700 font-medium">
                                    📈 {tip.suggestion}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-center text-center">
                        <TrendingUp size={24} className="text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500">Pricing is optimal</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper icon
function CheckCircle({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}

export default AiInsightsWidget;
