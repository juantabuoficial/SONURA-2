
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';

const Profile: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'es', label: 'ESPAÑOL' },
    { code: 'en', label: 'ENGLISH' },
    { code: 'fr', label: 'FRANÇAIS' }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in overflow-y-auto">
      <h1 className="text-3xl font-black text-white tracking-tighter mb-8">
            SONURA <span className="text-sonura-cyan">PROFILE</span>
      </h1>

      <div className="relative w-32 h-32 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-sonura-cyan to-purple-600 rounded-full blur-lg opacity-50"></div>
        <img 
          src="https://picsum.photos/200/200" 
          alt="Profile" 
          className="relative w-32 h-32 rounded-full border-4 border-sonura-surface object-cover z-10"
        />
        <div className="absolute bottom-0 right-0 bg-sonura-cyan text-black text-xs font-bold px-2 py-1 rounded-full z-20 shadow-neon">
          PRO
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-2">{t.profile.title}</h2>
      <p className="text-gray-500 mb-8">{t.profile.role}</p>

      {/* Stats / Info Card */}
      <div className="bg-sonura-surface p-6 rounded-xl w-full max-w-sm border border-gray-800 mb-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
          <span className="text-gray-400">{t.profile.subscriptionLabel}</span>
          <span className="text-sonura-cyan font-bold">SONURA INFINITE</span>
        </div>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
          <span className="text-gray-400">{t.profile.compositionsLabel}</span>
          <span className="text-white font-mono">124</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t.profile.serverStatusLabel}</span>
          <span className="flex items-center gap-2 text-green-400 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {t.profile.online}
          </span>
        </div>
      </div>

      {/* Settings / Language Switcher */}
      <div className="w-full max-w-sm">
        <h3 className="text-xs font-bold text-sonura-muted uppercase tracking-widest mb-4 text-left border-b border-gray-800 pb-2">
          {t.profile.settingsHeader}
        </h3>
        
        <div className="bg-sonura-surface p-4 rounded-xl border border-gray-800 flex items-center justify-between">
          <span className="text-gray-300 font-medium text-sm">{t.profile.languageLabel}</span>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1 text-xs font-bold rounded transition-all duration-300 border
                  ${language === lang.code 
                    ? 'bg-sonura-cyan/20 text-sonura-cyan border-sonura-cyan shadow-neon' 
                    : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
              >
                {lang.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
