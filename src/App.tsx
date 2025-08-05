import React from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { EditModal } from './components/EditModal';
import { WikiProvider, useWiki } from './context/WikiContext';

const AppContent: React.FC = () => {
  const { isDarkMode } = useWiki();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900 text-slate-100' 
        : 'bg-gray-50 text-gray-900'
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