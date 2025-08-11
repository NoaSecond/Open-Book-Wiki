import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { EditModal } from './components/EditModal';
import SimpleAdminPanel from './components/SimpleAdminPanel';
import { WikiProvider, useWiki } from './context/WikiContext';
import { getConfigService } from './services/configService';
import logger from './utils/logger';

const AppContent: React.FC = () => {
  const { isDarkMode, isAdminPanelOpen, setIsAdminPanelOpen, user, wikiData, isLoading, loadingMessage, isBackendConnected, retryConnection } = useWiki();
  const configService = getConfigService();
  const siteName = configService.getSiteName();
  
  useEffect(() => {
    logger.info('🚀 Application démarrée', siteName);
    const pageCount = Object.keys(wikiData).length;
    logger.debug('📄 Pages chargées', pageCount);
    if (user) {
      logger.user('👤 Utilisateur connecté', user.username);
    }
  }, [user, wikiData, siteName]);
  
  useEffect(() => {
    // Exposer la fonction de retry globalement
    (window as typeof window & { retryBackendConnection?: () => void }).retryBackendConnection = retryConnection;
    
    return () => {
      // Nettoyer lors du démontage
      delete (window as typeof window & { retryBackendConnection?: () => void }).retryBackendConnection;
    };
  }, [retryConnection]);
  
  useEffect(() => {
    // Mettre à jour le message de chargement dans l'écran de chargement HTML
    const updateLoadingMessage = () => {
      const loadingSubtitle = document.querySelector('.loading-subtitle');
      if (loadingSubtitle && isLoading) {
        loadingSubtitle.innerHTML = `${loadingMessage}<span class="loading-dots"></span>`;
      }
    };
    
    // Gérer l'affichage du bouton retry
    const updateRetryButton = () => {
      const retryButton = document.getElementById('retry-button');
      if (retryButton) {
        if (isLoading && !isBackendConnected && loadingMessage.includes('Connexion à la base de données')) {
          retryButton.classList.add('show');
        } else {
          retryButton.classList.remove('show');
        }
      }
    };
    
    updateLoadingMessage();
    updateRetryButton();
  }, [loadingMessage, isLoading, isBackendConnected]);
  
  useEffect(() => {
    // Masquer l'écran de chargement seulement quand l'initialisation est terminée ET que le backend est connecté
    // OU si on décide de continuer sans backend (pour l'instant, on reste en chargement)
    if (!isLoading && isBackendConnected) {
      const hideLoadingScreen = () => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.classList.add('hidden');
          setTimeout(() => {
            loadingScreen.remove();
          }, 500);
        }
      };
      
      // Petit délai pour s'assurer que le rendu est terminé
      const timer = setTimeout(() => {
        hideLoadingScreen();
        logger.success('✨ Interface utilisateur prête');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isBackendConnected]);
  
  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'dark bg-slate-900 text-slate-100' 
        : 'light bg-gray-50 text-gray-900'
    }`}>
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <MainContent />
      </div>
      <EditModal />
      <SimpleAdminPanel 
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