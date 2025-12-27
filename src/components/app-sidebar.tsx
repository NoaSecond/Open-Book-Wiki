import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import { useSidebarLogic } from '../hooks/use-sidebar-logic';
import SidebarHeader from './sidebar/sidebar-header';
import SidebarFooter from './sidebar/sidebar-footer';
import ActivityList from './sidebar/activity-list';
import NavigationList from './sidebar/navigation-list';
import AddCategoryModal from './sidebar/add-category-modal';
import { WikiPage, WikiSection } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    user,
    isDarkMode,
    hasPermission,
    wikiData
  } = useWiki();

  const {
    appVersion,
    recentActivities,
    dynamicNavigationItems,
    handleReorder,
    // Modal State
    showAddCategoryModal,
    setShowAddCategoryModal,
    // Handlers
    handleAddCategoryClick,
    handleCreateCategory,
    handleRenamePage,
    handleDeletePage
  } = useSidebarLogic();

  const availableIcons = useMemo(() => [
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
  ], []);

  return (
    <aside className={`w-64 h-full flex flex-col border-r transition-colors duration-300 ${isDarkMode
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
      }`}>

      <SidebarHeader onAddCategory={handleAddCategoryClick} />

      {/* Scrollable area for categories and sections */}
      <div className="flex-1 overflow-y-auto content-scrollbar px-4">

        <NavigationList
          items={dynamicNavigationItems}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          canReorder={hasPermission('reorder_pages')}
          canEdit={hasPermission('edit_pages') || hasPermission('delete_pages')}
          onReorder={handleReorder}
          onRename={handleRenamePage}
          onDelete={handleDeletePage}
          user={user}
          isDarkMode={isDarkMode}
        />

        {/* Current page sections */}
        {currentPage && wikiData[currentPage] && (() => {
          const currentPageData = wikiData[currentPage] as unknown as WikiPage & { sections?: WikiSection[] };
          const sections = currentPageData.sections || [{
            id: 'main-content',
            title: 'Contenu principal'
          } as WikiSection];

          return sections.length > 0 ? (
            <div className={`mb-6 p-3 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'
              }`}>
              <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Sections de la page
              </h3>
              <ul className="space-y-1">
                {sections.map((section: WikiSection) => (
                  <li key={section.id}>
                    <button
                      onClick={() => {
                        const element = document.getElementById(`section-${section.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full text-left flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors ${isDarkMode
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

        <ActivityList recentActivities={recentActivities} />

        <div className={`mt-4 p-4 bg-gradient-to-br rounded-lg border transition-colors duration-300 ${isDarkMode
          ? 'from-cyan-600/20 to-violet-600/20 border-cyan-500/30'
          : 'from-cyan-100/80 to-violet-100/80 border-cyan-200/50'
          }`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
            }`}>
            Contribuer
          </h3>
          <p className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
            Aidez à améliorer ce wiki en ajoutant du contenu et en corrigeant les erreurs.
          </p>
        </div>
      </div>

      <SidebarFooter appVersion={appVersion} />

      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        availableIcons={availableIcons}
        onCreate={async (name, iconIndex) => {
          await handleCreateCategory(name, availableIcons, iconIndex);
        }}
      />
    </aside>
  );
};