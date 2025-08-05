import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import logger from '../utils/logger';

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
  const { isDarkMode, setIsEditing, setEditingPage, canContribute } = useWiki();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    // Si une seule section, l'afficher dépliée par défaut
    sections.length === 1 ? new Set([sections[0].id]) : new Set()
  );

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
    logger.debug('✏️ Ouverture modal d\'édition', `Section: ${sectionId}`);
    setEditingPage(`${pageId}:${sectionId}`);
    setIsEditing(true);
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
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {section.title}
                </h3>
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
