import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { ProfilePage } from './ProfilePage';
import { MembersPage } from './MembersPage';
import { DatabasePage } from './DatabasePage';
import { CollapsibleSections } from './CollapsibleSections';
import logger from '../utils/logger';
import DateUtils from '../utils/dateUtils';

export const MainContent: React.FC = () => {
  const { currentPage, wikiData, setIsEditModalOpen, setEditingPageTitle, searchTerm, isDarkMode, addSection, canContribute, enrichPageWithSections } = useWiki();
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

  // Si c'est la page database, afficher le composant DatabasePage
  if (currentPage === 'database') {
    return <DatabasePage />;
  }
  
  const currentPageData = wikiData[currentPage];
  
  if (!currentPageData) {
    return (
      <main className="flex-1 p-6">
        <div className="text-center py-12">
          <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Page non trouvée
          </h2>
          <p className={`transition-colors duration-300 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
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
    <main className={`flex-1 content-scrollbar overflow-y-auto ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Page Header */}
        <div className={`mb-6 pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentPageData.title}</h1>
          {canContribute() && (
            <button
              onClick={handleAddSection}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une section</span>
            </button>
          )}
        </div>
        <div className={`flex items-center space-x-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Modifié {DateUtils.getRelativeTime(currentPageData.updated_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <User className="w-4 h-4" />
            <span>Par {currentPageData.author_username}</span>
          </div>
        </div>
        </div>

        {/* Search Results Indicator */}
        {searchTerm && (
          <div className={`mb-4 p-3 ${isDarkMode ? 'bg-cyan-600/20 border-cyan-500/30' : 'bg-cyan-100 border-cyan-300'} border rounded-lg`}>
            <p className={`text-sm ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
              Résultats de recherche pour "{searchTerm}"
            </p>
          </div>
        )}

        {/* Contenu de la page avec sections */}
        {currentPageWithSections && (
          <CollapsibleSections 
            sections={currentPageWithSections.sections || []}
            pageId={currentPage}
          />
        )}

        {/* Modal pour ajouter une section */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-90vw">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Ajouter une nouvelle section
              </h2>
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Titre de la section..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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