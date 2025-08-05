import React, { useState, useEffect } from 'react';
import { Home, Users, Gamepad2, BookOpen, Package, MapPin, Clock, User, Code, Plus, ExternalLink, Edit3, Trash2, MoreHorizontal, Check, X } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import activityService from '../services/activityService';

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
  const { currentPage, setCurrentPage, wikiData, isLoggedIn, isDarkMode, canContribute, addPage, renamePage, deletePage, isAdmin } = useWiki();
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [commitHash, setCommitHash] = useState('...');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [showPageMenu, setShowPageMenu] = useState<string | null>(null);

  // Créer les éléments de navigation dynamiquement à partir de wikiData
  const createNavigationItems = () => {
    const items = [];
    
    // Ajouter les pages statiques d'abord
    for (const navItem of navigationItems) {
      if (wikiData[navItem.id]) {
        items.push({
          ...navItem,
          title: wikiData[navItem.id].title
        });
      }
    }
    
    // Ajouter les pages dynamiques créées par les utilisateurs
    for (const [pageId, pageData] of Object.entries(wikiData)) {
      // Skip les pages qui sont déjà dans les navigationItems statiques
      if (!navigationItems.find(item => item.id === pageId)) {
        items.push({
          id: pageId,
          label: pageData.title,
          title: pageData.title,
          icon: BookOpen, // Icône par défaut pour les pages créées dynamiquement
          isDynamic: true
        });
      }
    }
    
    return items;
  };

  const dynamicNavigationItems = createNavigationItems();

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
      const newPageId = addPage(newCategoryName.trim());
      setCurrentPage(newPageId); // Naviguer vers la nouvelle page
      setShowAddCategoryModal(false);
      setNewCategoryName('');
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategoryModal(false);
    setNewCategoryName('');
  };

  const handleEditPage = (pageId: string, currentTitle: string) => {
    setEditingPageId(pageId);
    setEditingPageTitle(currentTitle);
    setShowPageMenu(null);
  };

  const handleSavePageEdit = () => {
    if (editingPageId && editingPageTitle.trim()) {
      renamePage(editingPageId, editingPageTitle.trim());
      setEditingPageId(null);
      setEditingPageTitle('');
    }
  };

  const handleCancelPageEdit = () => {
    setEditingPageId(null);
    setEditingPageTitle('');
  };

  const handleDeletePage = (pageId: string, pageTitle: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la page "${pageTitle}" ? Cette action est irréversible.`)) {
      deletePage(pageId);
      setShowPageMenu(null);
    }
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
          {dynamicNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isBeingEdited = editingPageId === item.id;
            
            return (
              <li key={item.id} className="relative">
                {isBeingEdited ? (
                  // Mode édition
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                    isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <input
                      type="text"
                      value={editingPageTitle}
                      onChange={(e) => setEditingPageTitle(e.target.value)}
                      className={`flex-1 px-2 py-1 text-sm rounded border-0 bg-transparent focus:outline-none ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSavePageEdit();
                        } else if (e.key === 'Escape') {
                          handleCancelPageEdit();
                        }
                      }}
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={handleSavePageEdit}
                        className={`p-1 rounded hover:bg-green-600 text-green-400 hover:text-white transition-colors`}
                        title="Sauvegarder"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleCancelPageEdit}
                        className={`p-1 rounded hover:bg-red-600 text-red-400 hover:text-white transition-colors`}
                        title="Annuler"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode normal
                  <div className="flex items-center group">
                    <button
                      onClick={() => setCurrentPage(item.id)}
                      className={`flex-1 flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-cyan-600 text-white'
                          : isDarkMode 
                            ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="truncate">{item.label}</span>
                      {item.isDynamic && (
                        <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                          isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          Nouveau
                        </span>
                      )}
                    </button>
                    
                    {/* Options d'administration pour les pages dynamiques */}
                    {isAdmin() && item.isDynamic && (
                      <div className="relative">
                        <button
                          onClick={() => setShowPageMenu(showPageMenu === item.id ? null : item.id)}
                          className={`p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDarkMode 
                              ? 'hover:bg-slate-600 text-slate-400 hover:text-slate-300' 
                              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                          }`}
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {/* Menu déroulant */}
                        {showPageMenu === item.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowPageMenu(null)}
                            />
                            <div className={`absolute right-0 top-full mt-1 w-40 rounded-md shadow-lg border z-20 ${
                              isDarkMode 
                                ? 'bg-slate-800 border-slate-700' 
                                : 'bg-white border-gray-200'
                            }`}>
                              <button
                                onClick={() => handleEditPage(item.id, item.label)}
                                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors ${
                                  isDarkMode 
                                    ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Renommer</span>
                              </button>
                              <button
                                onClick={() => handleDeletePage(item.id, item.label)}
                                className={`w-full flex items-center space-x-2 px-3 py-2 text-sm transition-colors text-red-400 hover:bg-red-600 hover:text-white`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
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

        {/* Afficher les sections de la page actuelle */}
        {wikiData[currentPage]?.sections && wikiData[currentPage].sections!.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className={`text-sm font-semibold ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Sections
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {wikiData[currentPage].sections!.length}
              </span>
            </div>
            <ul className="space-y-1">
              {wikiData[currentPage].sections!.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      // Faire défiler vers la section
                      const sectionElement = document.getElementById(section.id);
                      if (sectionElement) {
                        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`w-full flex items-center space-x-2 px-6 py-1.5 text-sm rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                    title={`Aller à la section: ${section.title}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isDarkMode ? 'bg-cyan-400' : 'bg-cyan-500'
                    }`} />
                    <span className="truncate text-left">{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`mt-8 p-4 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Dernières modifications
          </h3>
          <div className="space-y-2">
            {activityService.getRecentLogs(3).filter(log => 
              ['edit_page', 'edit_section', 'create_page', 'create_section'].includes(log.action)
            ).map((log) => (
              <div key={log.id} className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">{activityService.getActionIcon(log.action)}</span>
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-800'
                  }`}>
                    {activityService.formatAction(log.action)}
                  </span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <User className="w-3 h-3" />
                  <span>{log.username}</span>
                </div>
                {log.target && (
                  <div className={`truncate transition-colors duration-300 ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-800'
                  }`}>
                    {log.target}
                  </div>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
            {activityService.getRecentLogs(3).filter(log => 
              ['edit_page', 'edit_section', 'create_page', 'create_section'].includes(log.action)
            ).length === 0 && (
              <div className={`text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-slate-500' : 'text-gray-500'
              }`}>
                Aucune modification récente
              </div>
            )}
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