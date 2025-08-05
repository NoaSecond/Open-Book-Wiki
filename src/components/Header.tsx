import React, { useState } from 'react';
import { Search, LogIn } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { UserMenu } from './UserMenu';
import { LoginModal } from './LoginModal';
import { getConfigService } from '../services/configService';
import logger from '../utils/logger';

export const Header: React.FC = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    isLoggedIn,
    isDarkMode,
    setCurrentPage
  } = useWiki();
  
  const configService = getConfigService();
  const siteName = configService.getSiteName();
  const siteDescription = configService.getSiteDescription();
  
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className={`shadow-lg border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  logger.debug('🏠 Navigation vers l\'accueil');
                }}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
                title="Retour à l'accueil"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <img 
                    src="/Icon.svg" 
                    alt={`${siteName} Icon`} 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {siteName || 'Open Book Wiki'}
                  </h1>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {siteDescription || 'Wiki open source'}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Rechercher dans le wiki..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.length > 2) {
                      logger.debug('🔍 Recherche', e.target.value);
                    }
                  }}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64 transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-700 text-white border-slate-600' 
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                />
              </div>

              {isLoggedIn ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => {
                    setShowLoginModal(true);
                    logger.auth('🔐 Ouverture du modal de connexion');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Se connecter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
};