import React from 'react';
import { Edit3, Calendar, User, Eye } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ProfilePage } from './ProfilePage';

export const MainContent: React.FC = () => {
  const { currentPage, wikiData, setIsEditing, setEditingPage, searchTerm, isDarkMode } = useWiki();
  
  // Si c'est la page profil, afficher le composant ProfilePage
  if (currentPage === 'profile') {
    return <ProfilePage />;
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

  const handleEdit = () => {
    setEditingPage(currentPage);
    setIsEditing(true);
  };

  // Filter content based on search term
  const filteredContent = searchTerm 
    ? currentPageData.content.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : currentPageData.content;

  return (
    <main className={`flex-1 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Page Header */}
        <div className={`mb-6 pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentPageData.title}</h1>
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Modifier cette page</span>
            </button>
          </div>
          
          <div className={`flex items-center space-x-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Modifié le {currentPageData.lastModified}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>Par {currentPageData.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>Lecture {Math.floor(Math.random() * 1000) + 100} vues</span>
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

        {/* Page Content */}
        <div className={`rounded-lg p-6 shadow-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <MarkdownRenderer content={filteredContent} searchTerm={searchTerm} />
        </div>

        {/* Page Footer */}
        <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            <div>
              <p>Cette page fait partie du Wiki Star Deception</p>
              <p>Contribuez en améliorant le contenu</p>
            </div>
            <div className="flex space-x-4">
              <button className={`transition-colors ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'}`}>
                Signaler un problème
              </button>
              <button className={`transition-colors ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'}`}>
                Voir l'historique
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};