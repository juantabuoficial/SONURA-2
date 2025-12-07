
import React, { useState, useEffect } from 'react';
import Studio from './components/Studio';
import Luthier from './components/Luthier';
import Profile from './components/Profile';
import Decoder from './components/Decoder';
import { NavItem } from './types';
import { useLanguage } from './contexts/LanguageContext';

// Icons
const IconStudio = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const IconDecoder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const IconLuthier = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const IconProfile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const App: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<NavItem>(NavItem.STUDIO);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case NavItem.STUDIO:
        return <Studio />;
      case NavItem.DECODER:
        return <Decoder />;
      case NavItem.LUTHIER:
        return <Luthier />;
      case NavItem.PROFILE:
        return <Profile />;
      default:
        return <Studio />;
    }
  };

  const navItems = [
    { id: NavItem.STUDIO, label: t.nav.studio, icon: IconStudio },
    { id: NavItem.DECODER, label: t.nav.decoder, icon: IconDecoder },
    { id: NavItem.LUTHIER, label: t.nav.luthier, icon: IconLuthier },
    { id: NavItem.PROFILE, label: t.nav.profile, icon: IconProfile },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-sonura-bg text-sonura-text overflow-hidden selection:bg-sonura-cyan selection:text-black">
      
      {/* Desktop Navigation Rail */}
      {!isMobile && (
        <nav className="w-24 border-r border-gray-800 bg-black/50 backdrop-blur-md flex flex-col items-center py-8 z-50">
          <div className="mb-12">
            <div className="w-12 h-12 rounded bg-gradient-to-tr from-sonura-cyan to-blue-500 flex items-center justify-center font-black text-black text-xl shadow-neon">
              S
            </div>
          </div>
          <div className="flex flex-col gap-8 w-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative group flex flex-col items-center justify-center w-full py-3 transition-all duration-300
                    ${isActive ? 'text-sonura-cyan' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-sonura-cyan shadow-[0_0_10px_#00E5FF]"></div>
                  )}
                  <Icon />
                  <span className="text-[10px] uppercase font-bold mt-1 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity absolute top-10 bg-black px-2 py-1 rounded border border-gray-800 z-50 pointer-events-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none"></div>
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-lg border-t border-gray-800 z-50 flex justify-around items-center px-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 transition-colors duration-300 ${isActive ? 'text-sonura-cyan' : 'text-gray-500'}`}
              >
                <div className={`p-2 rounded-full transition-all duration-300 ${isActive ? 'bg-sonura-cyan/10' : ''}`}>
                  <Icon />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default App;
