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
  const { currentPage, setCurrentPage, wikiData, isLoggedIn } = useWiki();

  return (
    <aside className="w-64 bg-slate-800 min-h-[calc(100vh-80px)] border-r border-slate-700">
      <nav className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Navigation</h2>
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
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Mon Profil</span>
              </button>
            </li>
          )}
        </ul>

        <div className="mt-8 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">Dernières modifications</h3>
          <div className="space-y-2">
            {Object.entries(wikiData).slice(0, 3).map(([key, page]) => (
              <div key={key} className="text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{page.lastModified}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <User className="w-3 h-3" />
                  <span>{page.author}</span>
                </div>
                <div className="text-slate-300 truncate">{page.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-4 bg-gradient-to-br from-cyan-600/20 to-violet-600/20 rounded-lg border border-cyan-500/30">
          <h3 className="text-sm font-semibold text-cyan-300 mb-2">Contribuer</h3>
          <p className="text-xs text-slate-300">
            Aidez à améliorer ce wiki en ajoutant du contenu et en corrigeant les erreurs.
          </p>
        </div>
      </nav>
    </aside>
  );
};