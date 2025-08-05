import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, Edit, X, Check } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CollapsibleSectionsProps {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    lastModified: string;
    author: string;
  }>;
  pageId: string;
}

export const CollapsibleSections: React.FC<CollapsibleSectionsProps> = ({ sections, pageId }) => {
  const { isDarkMode, setIsEditing, setEditingPage, canContribute, user, renameSection, deleteSection } = useWiki();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    // Si une seule section, l'afficher dépliée par défaut
    sections.length === 1 ? new Set([sections[0].id]) : new Set()
  );
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleEdit = (sectionId: string) => {
    setEditingPage(`${pageId}:${sectionId}`);
    setIsEditing(true);
  };

  const isAdmin = () => user?.tags?.includes('Administrateur');

  const handleRenameSection = (sectionId: string, currentTitle: string) => {
    setEditingTitle(sectionId);
    setNewTitle(currentTitle);
  };

  const saveRename = (sectionId: string) => {
    if (newTitle.trim() && newTitle !== sections.find(s => s.id === sectionId)?.title) {
      renameSection(pageId, sectionId, newTitle.trim());
    }
    setEditingTitle(null);
    setNewTitle('');
  };

  const cancelRename = () => {
    setEditingTitle(null);
    setNewTitle('');
  };

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) {
      alert('Impossible de supprimer la dernière section de la page.');
      return;
    }
    setConfirmDelete(sectionId);
  };

  const confirmDeleteSection = (sectionId: string) => {
    deleteSection(pageId, sectionId);
    setConfirmDelete(null);
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        
        return (
          <div 
            key={section.id}
            id={section.id}
            className={`border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-slate-600' : 'border-gray-200'
            }`}
          >
            {/* Header de la section */}
            <div 
              className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                {editingTitle === section.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className={`px-2 py-1 rounded text-sm border ${
                        isDarkMode 
                          ? 'bg-slate-600 border-slate-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(section.id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(section.id);
                      }}
                      className="p-1 text-green-600 hover:text-green-700"
                      title="Sauvegarder"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelRename();
                      }}
                      className="p-1 text-red-600 hover:text-red-700"
                      title="Annuler"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {section.title}
                  </h3>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {section.lastModified} par {section.author}
                </div>
                {canContribute() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(section.id);
                    }}
                    className={`p-2 rounded-md transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-500 text-slate-300' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Modifier cette section"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {isAdmin() && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameSection(section.id, section.title);
                      }}
                      className={`p-2 rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-slate-500 text-slate-300' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Renommer cette section"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {sections.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirmDelete === section.id) {
                            confirmDeleteSection(section.id);
                          } else {
                            handleDeleteSection(section.id);
                          }
                        }}
                        className={`p-2 rounded-md transition-colors ${
                          confirmDelete === section.id
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : isDarkMode 
                              ? 'hover:bg-slate-500 text-slate-300' 
                              : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        title={confirmDelete === section.id ? "Confirmer la suppression" : "Supprimer cette section"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {confirmDelete === section.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelDelete();
                        }}
                        className={`p-2 rounded-md transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-slate-500 text-slate-300' 
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        title="Annuler la suppression"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contenu de la section */}
            {isExpanded && (
              <div className={`p-6 border-t ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-600' 
                  : 'bg-white border-gray-200'
              }`}>
                <MarkdownRenderer content={section.content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
