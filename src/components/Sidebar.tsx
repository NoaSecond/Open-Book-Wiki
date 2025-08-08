import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Plus, ExternalLink, Edit3, Trash2, MoreHorizontal, Check, X, Clock, ChevronRight
} from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { getConfigService } from '../services/configService';
import activityService, { ActivityLog } from '../services/activityService';
import SvgIcon from './SvgIcon';
import DragHandle from './DragHandle';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Type pour les éléments de navigation
type NavigationItem = {
  id: string;
  label: string;
  title?: string;
  iconName: string; // Toujours SVG maintenant
};

// Icônes disponibles pour les catégories
const availableIcons = [
  { name: 'home', label: 'Maison' },
  { name: 'book-open', label: 'Livre' },
  { name: 'code', label: 'Code' },
  { name: 'star', label: 'Étoile' },
  { name: 'heart', label: 'Cœur' },
  { name: 'coffee', label: 'Café' },
  { name: 'music', label: 'Musique' },
  { name: 'camera', label: 'Caméra' },
  { name: 'gamepad', label: 'Jeu' },
  { name: 'palette', label: 'Palette' },
  { name: 'mountain', label: 'Montagne' },
  { name: 'compass', label: 'Boussole' },
  { name: 'trophy', label: 'Trophée' },
  { name: 'shield', label: 'Bouclier' },
  { name: 'zap', label: 'Éclair' },
  { name: 'globe', label: 'Globe' }
];

export const Sidebar: React.FC = () => {
  const {
    wikiData,
    currentPage,
    setCurrentPage,
    addPage,
    renamePage,
    deletePage,
    reorderPages,
    user,
    isDarkMode,
    canContribute,
    isAdmin
  } = useWiki();
  
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  
  useEffect(() => {
    if (user) {
      // Charger les activités récentes
      const loadActivities = async () => {
        try {
          const activities = await activityService.getLogs(10);
          
          // Filtrer pour les modifications récentes
          const recentMods = activities.filter((log: ActivityLog) => 
            ['edit_page', 'edit_section', 'create_page', 'create_section'].includes(log.action)
          ).slice(0, 3);
          setRecentActivities(recentMods);
        } catch (error) {
          console.error('Erreur lors du chargement des activités:', error);
        }
      };
      
      loadActivities();
    }
  }, [user]);
  const [appVersion, setAppVersion] = useState('...');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = useState('');
  const [showPageMenu, setShowPageMenu] = useState<string | null>(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [orderUpdateTrigger, setOrderUpdateTrigger] = useState(0);

  // Créer les éléments de navigation dynamiquement à partir de wikiData
  const createNavigationItems = (): NavigationItem[] => {
    const items: NavigationItem[] = [];
    
    // Ajouter toutes les pages depuis wikiData
    for (const [pageId, pageData] of Object.entries(wikiData)) {
      // Assigner l'icône appropriée selon le titre de la page
      let iconName = 'book-open'; // Icône par défaut
      if (pageData.title === 'Accueil') {
        iconName = 'home';
      }
      
      items.push({
        id: pageId,
        label: pageData.title,
        title: pageData.title,
        iconName: iconName
      });
    }
    
    // Appliquer l'ordre personnalisé si il existe dans localStorage
    try {
      const savedOrder = localStorage.getItem('wiki_pages_order');
      if (savedOrder) {
        const pageOrder = JSON.parse(savedOrder) as string[];
        
        // Réorganiser les items selon l'ordre sauvegardé
        const orderedItems: NavigationItem[] = [];
        
        // D'abord, ajouter les éléments dans l'ordre sauvegardé
        pageOrder.forEach(pageId => {
          const item = items.find(item => item.id === pageId);
          if (item) {
            orderedItems.push(item);
          }
        });
        
        // Ensuite, ajouter les nouvelles pages qui ne sont pas dans l'ordre sauvegardé
        items.forEach(item => {
          if (!pageOrder.includes(item.id)) {
            orderedItems.push(item);
          }
        });
        
        return orderedItems;
      }
    } catch (error) {
      console.warn('Erreur lors du chargement de l\'ordre des pages:', error);
    }
    
    return items;
  };

  const dynamicNavigationItems = useMemo(() => createNavigationItems(), [wikiData, orderUpdateTrigger]);

  // Fonction pour récupérer la version de l'application
  useEffect(() => {
    const configService = getConfigService();
    const version = configService.getConfig().version;
    setAppVersion(version);
  }, []);

  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      // Créer une nouvelle page avec l'icône sélectionnée
      const selectedIcon = availableIcons[selectedIconIndex];
      
      // Créer la nouvelle page via le contexte
      const newPageId = await addPage(newCategoryName.trim());
      
      // Naviguer vers la nouvelle page
      if (newPageId) {
        setCurrentPage(newCategoryName.trim()); // Utiliser le titre comme identifiant de page
      }
      
      console.log(`Catégorie créée: ${newCategoryName.trim()} avec icône: ${selectedIcon.name}`);
      
      // Fermer la modal et réinitialiser
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      setSelectedIconIndex(0);
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setSelectedIconIndex(0);
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

  // Fonction pour gérer le drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const pageIds = dynamicNavigationItems.map((item: NavigationItem) => item.id);
      const oldIndex = pageIds.indexOf(active.id as string);
      const newIndex = pageIds.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...pageIds];
        const [removed] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, removed);
        
        // Sauvegarder l'ordre localement et déclencher la re-render
        localStorage.setItem('wiki_pages_order', JSON.stringify(newOrder));
        setOrderUpdateTrigger(prev => prev + 1);
        
        // Appeler aussi la fonction du contexte pour la cohérence
        reorderPages(newOrder);
        console.log('Pages réorganisées:', newOrder);
      }
    }
  };

  // Composant pour chaque élément draggable (pour respecter les Rules of Hooks)
  const SortableItem: React.FC<{ 
    item: NavigationItem; 
    isActive: boolean; 
    isBeingEdited: boolean; 
  }> = ({ item, isActive, isBeingEdited }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <li ref={setNodeRef} style={style} className="relative">
        {isBeingEdited ? (
          // Mode édition
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
            isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'
          }`}>
            <SvgIcon 
              name={item.iconName!} 
              className={`w-5 h-5 flex-shrink-0 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`} 
            />
            <input
              type="text"
              value={editingPageTitle}
              onChange={(e) => setEditingPageTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePageEdit();
                if (e.key === 'Escape') handleCancelPageEdit();
              }}
              className={`flex-1 px-2 py-1 rounded border transition-colors ${
                isDarkMode 
                  ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-300' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Nom de la page"
              autoFocus
            />
            <div className="flex space-x-1">
              <button
                onClick={handleSavePageEdit}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelPageEdit}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Mode normal
          <div className="flex items-center group">
            {/* Handle de drag */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
              <DragHandle />
            </div>
            
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
              <SvgIcon 
                name={item.iconName!} 
                className={`w-5 h-5 ${
                  isActive 
                    ? 'text-white' 
                    : isDarkMode 
                      ? 'text-slate-300' 
                      : 'text-gray-700'
                }`} 
              />
              <span className="truncate">{item.label}</span>
            </button>
            
            {/* Menu d'options pour les admins */}
            {isAdmin() && (
              <div className="relative">
                <button
                  onClick={() => setShowPageMenu(showPageMenu === item.id ? null : item.id)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
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
  };

  // Composant pour chaque élément statique (non-draggable pour les non-admins)
  const StaticItem: React.FC<{ 
    item: NavigationItem; 
    isActive: boolean; 
    isBeingEdited: boolean; 
  }> = ({ item, isActive, isBeingEdited }) => {
    return (
      <li className="relative">
        {isBeingEdited ? (
          // Mode édition
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
            isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'
          }`}>
            <SvgIcon 
              name={item.iconName!} 
              className={`w-5 h-5 flex-shrink-0 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`} 
            />
            <input
              type="text"
              value={editingPageTitle}
              onChange={(e) => setEditingPageTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePageEdit();
                if (e.key === 'Escape') handleCancelPageEdit();
              }}
              className={`flex-1 px-2 py-1 rounded border transition-colors ${
                isDarkMode 
                  ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-300' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="Nom de la page"
              autoFocus
            />
            <div className="flex space-x-1">
              <button
                onClick={handleSavePageEdit}
                className="text-green-500 hover:text-green-400 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelPageEdit}
                className="text-red-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Mode normal (sans drag handle)
          <div className="flex items-center group">
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
              <SvgIcon 
                name={item.iconName!} 
                className={`w-5 h-5 ${
                  isActive 
                    ? 'text-white' 
                    : isDarkMode 
                      ? 'text-slate-300' 
                      : 'text-gray-700'
                }`} 
              />
              <span className="truncate">{item.label}</span>
            </button>
            
            {/* Menu d'options pour les admins */}
            {isAdmin() && (
              <div className="relative">
                <button
                  onClick={() => setShowPageMenu(showPageMenu === item.id ? null : item.id)}
                  className={`p-1 rounded transition-colors ${
                    isDarkMode 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
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
  };

  return (
    <aside className={`w-64 h-full flex flex-col border-r transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header fixe de la navigation */}
      <div className="p-4 flex-shrink-0">
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
      </div>

      {/* Zone scrollable pour les catégories et sections */}
      <div className="flex-1 overflow-y-auto content-scrollbar px-4">
        {isAdmin() ? (
          <DndContext 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={dynamicNavigationItems.map((item: NavigationItem) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2 mb-6">
                {dynamicNavigationItems.map((item: NavigationItem) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    isActive={currentPage === item.id}
                    isBeingEdited={editingPageId === item.id}
                  />
                ))}
                
                {/* Lien vers le profil si connecté */}
                {user && (
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
            </SortableContext>
          </DndContext>
        ) : (
          <ul className="space-y-2 mb-6">
            {dynamicNavigationItems.map((item: NavigationItem) => (
              <StaticItem
                key={item.id}
                item={item}
                isActive={currentPage === item.id}
                isBeingEdited={editingPageId === item.id}
              />
            ))}
            
            {/* Lien vers le profil si connecté */}
            {user && (
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
        )}

        {/* Sections de la page courante */}
        {currentPage && wikiData[currentPage] && (() => {
          const currentPageData = wikiData[currentPage] as any; // Type temporaire
          // Utiliser les sections si elles existent, sinon créer une section unique
          const sections = currentPageData.sections || [{
            id: 'main-content',
            title: 'Contenu principal'
          }];
          
          return sections.length > 0 ? (
            <div className={`mb-6 p-3 rounded-lg transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'
            }`}>
              <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Sections de la page
              </h3>
              <ul className="space-y-1">
                {sections.map((section: any) => (
                  <li key={section.id}>
                    <button
                      onClick={() => {
                        // Faire défiler vers la section
                        const element = document.getElementById(`section-${section.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full text-left flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors ${
                        isDarkMode 
                          ? 'text-slate-300 hover:bg-slate-600 hover:text-white' 
                          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

        <div className={`mt-8 p-4 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Dernières modifications
          </h3>
          <div className="space-y-2">
            {recentActivities.map((log: ActivityLog) => (
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
            {recentActivities.length === 0 && (
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
      </div>

      {/* Footer fixe en bas */}
      <div className={`flex-shrink-0 p-4 border-t text-center ${
        isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
      }`}>
        <a
          href="https://github.com/NoaSecond/Open-Book-Wiki"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center space-x-2 text-xs transition-colors duration-300 hover:underline ${
            isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Open Book Wiki</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <div className={`text-xs transition-colors duration-300 ${
          isDarkMode ? 'text-slate-500' : 'text-gray-400'
        }`}>
          v{appVersion}
        </div>
      </div>

      {/* Modal pour ajouter une catégorie */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl w-96 max-w-90vw max-h-80vh overflow-y-auto ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Ajouter une nouvelle catégorie
            </h2>
            
            {/* Nom de la catégorie */}
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nom de la catégorie..."
              className={`w-full p-3 border rounded-lg mb-4 ${
                isDarkMode 
                  ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCategory();
                } else if (e.key === 'Escape') {
                  handleCancelAddCategory();
                }
              }}
            />
            
            {/* Sélecteur d'icône */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                Choisir une icône :
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                {availableIcons.map((iconData, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIconIndex(index)}
                    className={`p-2 rounded-lg transition-colors border-2 ${
                      selectedIconIndex === index
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : isDarkMode
                          ? 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }`}
                    title={iconData.label}
                  >
                    <SvgIcon 
                      name={iconData.name} 
                      className={`w-5 h-5 ${
                        selectedIconIndex === index
                          ? 'text-cyan-400'
                          : isDarkMode
                            ? 'text-slate-400'
                            : 'text-gray-600'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelAddCategory}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-600 text-white hover:bg-slate-500' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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