import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus } from 'lucide-react';
import { useWiki } from '../context/wiki-context';
import { ProfilePage } from './profile-page';
import { MembersPage } from './members-page';
import { CollapsibleSections } from './collapsible-sections';
import logger from '../utils/logger';
import DateUtils from '../utils/dateUtils';

export const MainContent: React.FC = () => {
  const { currentPage, wikiData, setCurrentPage, setIsEditModalOpen, setEditingPageTitle, searchTerm, searchResults, addSection, canContribute, enrichPageWithSections } = useWiki();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Enregistrer la vue de page et récupérer les statistiques
  useEffect(() => {
    if (currentPage && wikiData[currentPage]) {
      logger.debug('📊 Page vue', currentPage);
    }
  }, [currentPage, wikiData]);

  // Si c'est la page profil, afficher le composant ProfilePage
  if (currentPage === 'profile') {
    return <ProfilePage />;
  }

  // Si c'est la page membres, afficher le composant MembersPage
  if (currentPage === 'members') {
    return <MembersPage />;
  }

  const currentPageData = wikiData[currentPage];

  if (!currentPageData) {
    return (
      <main className="flex-1 p-6">
        <div className="text-center py-12">
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 text-custom-text`}>
            Page non trouvée
          </h2>
          <p className={`transition-colors duration-300 text-custom-muted`}>
            La page demandée n'existe pas.
          </p>
        </div>
      </main>
    );
  }

  const handleAddSection = () => {
    setShowAddModal(true);
  };

  const handleCreateSection = async () => {
    if (newSectionTitle.trim()) {
      try {
        const newSectionId = await addSection(newSectionTitle.trim());
        if (newSectionId) {
          setEditingPageTitle(`${currentPage}:${newSectionId}`);
          setIsEditModalOpen(true);
        }
        setShowAddModal(false);
        setNewSectionTitle('');
      } catch (error) {
        logger.error('Erreur lors de la création de section', error instanceof Error ? error.message : String(error));
      }
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewSectionTitle('');
  };

  // Enrichir la page actuelle avec des sections
  const currentPageWithSections = currentPageData ? enrichPageWithSections(currentPageData) : null;

  return (
    <main className={`flex-1 content-scrollbar overflow-y-auto bg-custom-bg text-custom-text`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Page Header */}
        <div className={`mb-6 pb-4 border-b border-custom-border`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-3xl font-bold text-custom-text`}>{currentPageData.title}</h1>
            {canContribute() && (
              <button
                onClick={handleAddSection}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une section</span>
              </button>
            )}
          </div>
          <div className={`flex items-center space-x-6 text-sm text-custom-muted`}>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Modifié {DateUtils.getRelativeTime(currentPageData.updated_at || DateUtils.getCurrentTimestamp())}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>Par {currentPageData.author_username}</span>
            </div>
          </div>
        </div>

        {/* Search Results Indicator */}
        {searchTerm && (
          <div className={`mb-4 p-3 bg-primary/10 border-primary/30 border rounded-lg`}>
            <p className={`text-sm text-primary`}>
              Résultats de recherche pour "{searchTerm}" ({searchResults.length} résultat{searchResults.length > 1 ? 's' : ''})
            </p>
          </div>
        )}

        {/* Résultats de recherche ou contenu de la page avec sections */}
        {searchTerm && searchTerm.length > 2 ? (
          /* Afficher les résultats de recherche */
          <div className="space-y-4">
            {searchResults.length > 0 ? (
              searchResults.map((page) => {
                const enrichedPage = enrichPageWithSections(page);
                return (
                  <div key={page.title} className={`p-4 border rounded-lg border-custom-border bg-custom-surface/50`}>
                    <h3 className={`text-lg font-semibold mb-2 text-custom-text`}>
                      <button
                        onClick={() => setCurrentPage(page.title)}
                        className="hover:text-primary transition-colors"
                      >
                        {page.title}
                      </button>
                    </h3>
                    <div className={`text-sm mb-2 text-custom-muted`}>
                      Par {page.author_username} • Modifié {DateUtils.getRelativeTime(page.updated_at || DateUtils.getCurrentTimestamp())}
                    </div>
                    {enrichedPage.sections && enrichedPage.sections.length > 0 && (
                      <CollapsibleSections
                        sections={enrichedPage.sections}
                        pageId={page.title}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              <div className={`text-center py-8 text-custom-text/60`}>
                Aucun résultat trouvé pour "{searchTerm}"
              </div>
            )}
          </div>
        ) : currentPageWithSections ? (
          /* Afficher le contenu normal de la page */
          <CollapsibleSections
            sections={currentPageWithSections.sections || []}
            pageId={currentPage}
          />
        ) : null}

        {/* Modal pour ajouter une section */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-custom-surface p-6 rounded-lg shadow-xl w-96 max-w-[90vw] border border-custom-border">
              <h2 className="text-xl font-bold mb-4 text-custom-text">
                Ajouter une nouvelle section
              </h2>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Titre de la section..."
                className="w-full p-3 border border-custom-border rounded-lg mb-4 bg-custom-bg text-custom-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateSection();
                  } else if (e.key === 'Escape') {
                    handleCancelAdd();
                  }
                }}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelAdd}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSection}
                  disabled={!newSectionTitle.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};