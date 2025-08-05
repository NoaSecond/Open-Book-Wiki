import React from 'react';
import { Home, Users, Gamepad2, BookOpen, Package, MapPin, Clock, User } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

const navigationItems = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'characters', label: 'Personnages', icon: Users },
  { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
  { id: 'story', label: 'Histoire', icon: BookOpen },
  { id: 'items', label: 'Objets', icon: Package },
  { id: 'locations', label: 'Lieux', icon: MapPin },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, wikiData, isLoggedIn, isDarkMode } = useWiki();

  return (
    <aside className={`w-64 min-h-[calc(100vh-80px)] border-r transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-gray-200'
    }`}>
      <nav className="p-4">
        <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Navigation
        </h2>
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : isDarkMode 
                        ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
          
          {/* Lien vers le profil si connecté */}
          {isLoggedIn && (
            <li>
              <button
                onClick={() => setCurrentPage('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 'profile'
                    ? 'bg-cyan-600 text-white'
                    : isDarkMode 
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Mon Profil</span>
              </button>
            </li>
          )}
        </ul>

        <div className={`mt-8 p-4 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Dernières modifications
          </h3>
          <div className="space-y-2">
            {Object.entries(wikiData).slice(0, 3).map(([key, page]) => (
              <div key={key} className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{page.lastModified}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <User className="w-3 h-3" />
                  <span>{page.author}</span>
                </div>
                <div className={`truncate transition-colors duration-300 ${
                  isDarkMode ? 'text-slate-300' : 'text-gray-800'
                }`}>
                  {page.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-4 p-4 bg-gradient-to-br rounded-lg border transition-colors duration-300 ${
          isDarkMode 
            ? 'from-cyan-600/20 to-violet-600/20 border-cyan-500/30' 
            : 'from-cyan-100/80 to-violet-100/80 border-cyan-200/50'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
          }`}>
            Contribuer
          </h3>
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-slate-300' : 'text-gray-700'
          }`}>
            Aidez à améliorer ce wiki en ajoutant du contenu et en corrigeant les erreurs.
          </p>
        </div>
      </nav>
    </aside>
  );
};