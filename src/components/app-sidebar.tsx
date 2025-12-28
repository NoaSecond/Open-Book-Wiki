import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import { useSidebarLogic } from '../hooks/use-sidebar-logic';
import SidebarHeader from './sidebar/sidebar-header';
import SidebarFooter from './sidebar/sidebar-footer';
import ActivityList from './sidebar/activity-list';
import NavigationList from './sidebar/navigation-list';
import AddCategoryModal from './sidebar/add-category-modal';
import ConfirmModal from './sidebar/confirm-modal';
import { WikiPage, WikiSection } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    user,
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
    handleDeletePage,
    handleRenamePage,
    handleUpdateIcon,
    // Deletion Modal
    deletionState,
    handleConfirmDelete,
    handleCancelDelete
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
    <aside className={`w-64 h-full flex flex-col border-r transition-colors duration-300 bg-custom-sidebar border-custom-border`}>

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
          onIconChange={handleUpdateIcon}
          availableIcons={availableIcons}
          user={user}
        />

        {/* Current page sections */}
        {currentPage && (wikiData[currentPage] || Object.values(wikiData).find(p => p.title === currentPage)) && (() => {
          const currentPageData = (wikiData[currentPage] || Object.values(wikiData).find(p => p.title === currentPage)) as WikiPage;
          const sections = currentPageData.sections || [{
            id: 'main-content',
            title: 'Contenu principal'
          } as WikiSection];

          return sections.length > 0 ? (
            <div className={`mb-6 p-3 rounded-lg transition-colors duration-300 bg-custom-surface/50`}>
              <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 text-custom-text`}>
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
                      className={`w-full text-left flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors text-custom-muted hover:bg-custom-surface hover:text-custom-text`}
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

        <div className={`mt-4 mb-6 p-4 bg-primary/20 rounded-lg border border-primary/30 transition-colors duration-300`}>
          <h3 className={`text-sm font-semibold mb-2 transition-colors duration-300 text-primary`}>
            Contribuer
          </h3>
          <p className={`text-xs transition-colors duration-300 text-custom-text/80`}>
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
      <ConfirmModal
        isOpen={deletionState.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Supprimer la catégorie"
        message={`Êtes-vous sûr de vouloir supprimer la catégorie "${deletionState.title}" ? Cette action est irréversible et supprimera tout son contenu.`}
        confirmText="Supprimer"
        type="danger"
      />
    </aside>
  );
};