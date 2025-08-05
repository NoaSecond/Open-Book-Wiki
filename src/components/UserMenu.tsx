import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

export const UserMenu: React.FC = () => {
  const { user, setUser, setIsLoggedIn, setCurrentPage, isDarkMode, toggleTheme } = useWiki();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('home');
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    setCurrentPage('profile');
    setIsOpen(false);
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt="Avatar utilisateur" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
        <span className="text-sm font-medium">{user?.username}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 border rounded-lg shadow-lg z-50 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-2">
            <div className={`px-4 py-2 border-b transition-colors duration-300 ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.username}
              </p>
              <p className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {user?.email}
              </p>
            </div>
            
            <button
              onClick={handleProfileClick}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Mon profil</span>
            </button>
            
            <button
              onClick={handleThemeToggle}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'Mode clair' : 'Mode sombre'}</span>
            </button>
            
            <div className={`border-t mt-2 pt-2 transition-colors duration-300 ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                  isDarkMode 
                    ? 'text-red-400 hover:bg-slate-700 hover:text-red-300' 
                    : 'text-red-600 hover:bg-gray-100 hover:text-red-700'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
