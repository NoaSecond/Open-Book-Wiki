import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { EditModal } from './components/EditModal';
import { WikiProvider, useWiki } from './context/WikiContext';

const AppContent: React.FC = () => {
  const { isDarkMode } = useWiki();
  
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