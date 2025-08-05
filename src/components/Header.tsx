import React, { useState } from 'react';
import { Search, LogIn } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { UserMenu } from './UserMenu';
import { LoginModal } from './LoginModal';

export const Header: React.FC = () => {
  const { 
    searchTerm, 
    setSearchTerm, 
    isLoggedIn
  } = useWiki();
  
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
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
                  <h1 className="text-2xl font-bold text-white">Star Deception Wiki</h1>
                  <p className="text-slate-400 text-sm">Guide complet du jeu</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher dans le wiki..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64"
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