import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { EditModal } from './components/EditModal';
import { AdminPanel } from './components/AdminPanel';
import { WikiProvider, useWiki } from './context/WikiContext';
import logger from './utils/logger';

const AppContent: React.FC = () => {
  const { isDarkMode, isAdminPanelOpen, setIsAdminPanelOpen, user, wikiData, siteName } = useWiki();
  
  useEffect(() => {
    logger.info('🚀 Application démarrée', siteName);
    const pageCount = Object.keys(wikiData).length;
    logger.debug('📄 Pages chargées', pageCount);
    if (user) {
      logger.user('👤 Utilisateur connecté', user.username);
    }
  }, [user, wikiData, siteName]);
  
  useEffect(() => {
    // Signaler que l'application est prête
    const hideLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
          loadingScreen.remove();
        }, 500);
      }
    };
    
    // Attendre un court délai pour s'assurer que tout est rendu
    const timer = setTimeout(() => {
      hideLoadingScreen();
      logger.success('✨ Interface utilisateur prête');
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'dark bg-slate-900 text-slate-100' 
        : 'light bg-gray-50 text-gray-900'
    }`}>
      <Header />
      <div className="flex">
        <Sidebar />
        <MainContent />
      </div>
      <EditModal />
      <AdminPanel 
        isOpenFromMenu={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />
    </div>
  );
};

function App() {
  return (
    <WikiProvider>
      <AppContent />
    </WikiProvider>
  );
}

export default App;