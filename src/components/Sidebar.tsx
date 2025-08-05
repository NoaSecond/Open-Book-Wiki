import React, { useState, useEffect } from 'react';
import { Home, Users, Gamepad2, BookOpen, Package, MapPin, Clock, User, Code, Plus, ExternalLink } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

const navigationItems = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'characters', label: 'Personnages', icon: Users },
  { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
  { id: 'story', label: 'Histoire', icon: BookOpen },
  { id: 'items', label: 'Objets', icon: Package },
  { id: 'locations', label: 'Lieux', icon: MapPin },
  { id: 'development', label: 'Développement', icon: Code },
];

export const Sidebar: React.FC = () => {
  const { currentPage, setCurrentPage, wikiData, isLoggedIn, isDarkMode, canContribute } = useWiki();
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [commitHash, setCommitHash] = useState('...');

  // Fonction pour récupérer le hash du dernier commit
  useEffect(() => {
    // En production, vous pourriez récupérer cela depuis une API ou un endpoint
    // Pour l'instant, on simule avec un hash aléatoire
    const generateCommitHash = () => {
      const chars = 'abcdef0123456789';
      let result = '';
      for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    setCommitHash(generateCommitHash());
  }, []);

  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      // Ici vous pourriez ajouter la logique pour créer une nouvelle catégorie
      console.log('Nouvelle catégorie:', newCategoryName.trim());
      setShowAddCategoryModal(false);
      setNewCategoryName('');
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategoryModal(false);
    setNewCategoryName('');
  };

  return (
    <aside className={`w-64 min-h-[calc(100vh-80px)] border-r transition-colors duration-300 content-scrollbar overflow-y-auto ${
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
        
        {/* Bouton Ajouter une catégorie */}
        {canContribute() && (
          <div className="mb-4">
            <button
              onClick={handleAddCategory}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg border-2 border-dashed transition-colors ${
                isDarkMode 
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter une catégorie</span>
            </button>
          </div>
        )}

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

        {/* Lien GitHub avec version */}
        <div className={`mt-4 pt-4 border-t text-center ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <a
            href="https://github.com/NoaSecond/StarDeception-Wiki"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center space-x-2 text-xs transition-colors duration-300 hover:underline ${
              isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Projet sur GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-slate-500' : 'text-gray-400'
          }`}>
            {' '}- {commitHash}
          </span>
        </div>
      </nav>

      {/* Modal pour ajouter une catégorie */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-90vw">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Ajouter une nouvelle catégorie
            </h2>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nom de la catégorie..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory();
                } else if (e.key === 'Escape') {
                  handleCancelAddCategory();
                }
              }}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelAddCategory}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};