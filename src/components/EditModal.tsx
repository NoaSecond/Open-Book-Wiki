import React, { useState, useEffect } from 'react';
import { Save, X, Eye } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { MarkdownRenderer } from './MarkdownRenderer';

export const EditModal: React.FC = () => {
  const { 
    isEditing, 
    setIsEditing, 
    editingPage, 
    wikiData, 
    updatePage,
    isDarkMode 
  } = useWiki();
  
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (isEditing && editingPage) {
      // Si c'est une section (format: "pageId:sectionId")
      if (editingPage.includes(':')) {
        const [mainPageId, sectionId] = editingPage.split(':');
        const mainPage = wikiData[mainPageId];
        if (mainPage?.sections) {
          const section = mainPage.sections.find(s => s.id === sectionId);
          if (section) {
            setContent(section.content);
          }
        }
      } else {
        // Page simple (cas rare maintenant)
        const page = wikiData[editingPage];
        if (page?.content) {
          setContent(page.content);
        }
      }
    }
  }, [isEditing, editingPage, wikiData]);

  const handleSave = () => {
    if (editingPage) {
      updatePage(editingPage, content);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent('');
  };

  if (!isEditing || !editingPage) {
    return null;
  }

  // Déterminer le titre à afficher
  const getEditingTitle = () => {
    if (editingPage.includes(':')) {
      const [mainPageId, sectionId] = editingPage.split(':');
      const mainPage = wikiData[mainPageId];
      if (mainPage?.sections) {
        const section = mainPage.sections.find(s => s.id === sectionId);
        return section ? `${mainPage.title} - ${section.title}` : 'Section inconnue';
      }
    }
    return wikiData[editingPage]?.title || 'Page inconnue';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Modifier : {getEditingTitle()}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isPreview
                  ? `${isDarkMode ? 'bg-slate-600 text-white' : 'bg-gray-300 text-gray-800'}`
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{isPreview ? 'Éditer' : 'Aperçu'}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          {!isPreview && (
            <div className="w-full p-6">
              <div className="mb-4">
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Éditeur Markdown</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Utilisez la syntaxe Markdown pour formater votre contenu.
                </p>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full h-full border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 mini-scrollbar ${
                  isDarkMode 
                    ? 'bg-slate-900 text-white border-slate-600' 
                    : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}
                placeholder="Tapez votre contenu ici..."
              />
            </div>
          )}

          {/* Preview */}
          {isPreview && (
            <div className="w-full p-6 overflow-y-auto content-scrollbar">
              <div className="mb-4">
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Aperçu</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Voici comment votre contenu apparaîtra sur la page.
                </p>
              </div>
              <div className={`rounded-lg p-6 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`flex items-center justify-between text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            <div>
              <p>💡 <strong>Astuce :</strong> Utilisez # pour les titres, ## pour les sous-titres, et - pour les listes</p>
            </div>
            <div>
              Dernière modification : {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};