import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
        <Globe size={20} />
        <span className="hidden sm:inline text-sm font-medium">{t('language')}</span>
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 hidden group-hover:block">
        <div className="py-1">
          <button
            onClick={() => changeLanguage('en')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${i18n.language === 'en' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
          >
            {t('english')}
            {i18n.language === 'en' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
          </button>
          <button
            onClick={() => changeLanguage('ur')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${i18n.language === 'ur' ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
          >
            {t('urdu')}
            {i18n.language === 'ur' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
