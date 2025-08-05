import React, { useState } from 'react';
import { Search, LogIn } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { UserMenu } from './UserMenu';
import { LoginModal } from './LoginModal';

export const Header: React.FC = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    isLoggedIn,
    isDarkMode
  } = useWiki();
  
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
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img 
                    src="/Star Deception Logo.svg" 
                    alt="Star Deception Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Star Deception Wiki
                  </h1>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    Guide complet du jeu
                  </p>
                </div>
              </div>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => setShowLoginModal(true)}
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