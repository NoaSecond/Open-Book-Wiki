import React, { useState } from 'react';
import { ChevronDown, LogOut, Settings, Users } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

export const UserMenu: React.FC = () => {
  const { user, setUser, setIsLoggedIn, isDarkMode, setCurrentPage, isAdmin } = useWiki();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setIsOpen(false);
    setCurrentPage('home');
  };

  const handleProfile = () => {
    setCurrentPage('profile');
    setIsOpen(false);
  };

  const handleMembers = () => {
    setCurrentPage('members');
    setIsOpen(false);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return 'bg-red-500';
      case 'Contributeur':
        return 'bg-blue-500';
      case 'Visiteur':
        return 'bg-gray-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            user?.username.charAt(0).toUpperCase()
          )}
        </div>
        <span className="font-medium">{user?.username}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-20 mini-scrollbar ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    user?.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.username}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user?.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={handleProfile}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-700 text-white' 
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Profil</span>
              </button>

              {isAdmin() && (
                <button
                  onClick={handleMembers}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-slate-700 text-white' 
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gestion des membres</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-700 text-red-400' 
                    : 'hover:bg-gray-100 text-red-600'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};