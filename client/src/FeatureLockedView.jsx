import React from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function FeatureLockedView({ featureName, onUpgrade }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 m-4">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-200">
        <Lock className="w-10 h-10 text-slate-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {featureName || t('feature_locked')}
      </h2>
      
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        {t('feature_locked_desc', { feature: featureName })}
      </p>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 max-w-sm w-full mb-8">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          {t('upgrade_benefits')}
        </h3>
        <ul className="text-left space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
            {t('benefit_accounting')}
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
            {t('benefit_ai')}
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
            {t('benefit_support')}
          </li>
        </ul>
      </div>

      <button 
        onClick={onUpgrade}
        className="group relative inline-flex items-center justify-center px-8 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30"
      >
        <span>{t('upgrade_plan')}</span>
        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
      
      <p className="mt-4 text-xs text-slate-400">
        {t('contact_admin_upgrade')}
      </p>
    </div>
  );
}

export default FeatureLockedView;
