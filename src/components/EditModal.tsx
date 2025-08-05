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
    updatePage 
  } = useWiki();
  
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (isEditing && editingPage && wikiData[editingPage]) {
      setContent(wikiData[editingPage].content);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Modifier : {wikiData[editingPage]?.title}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isPreview
                  ? 'bg-slate-600 text-white'
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
                <h3 className="text-lg font-semibold text-white mb-2">Éditeur Markdown</h3>
                <p className="text-sm text-slate-400">
                  Utilisez la syntaxe Markdown pour formater votre contenu.
                </p>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full bg-slate-900 text-white border border-slate-600 rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Tapez votre contenu ici..."
              />
            </div>
          )}

          {/* Preview */}
          {isPreview && (
            <div className="w-full p-6 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Aperçu</h3>
                <p className="text-sm text-slate-400">
                  Voici comment votre contenu apparaîtra sur la page.
                </p>
              </div>
              <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-750">
          <div className="flex items-center justify-between text-sm text-slate-400">
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