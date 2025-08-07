import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Edit3, Trash2, Check, X } from 'lucide-react';
import SvgIcon from './SvgIcon';
import DragHandle from './DragHandle';

interface NavigationItem {
  id: string;
  label: string;
  title?: string;
  iconName: string;
}

interface DraggableCategoryProps {
  item: NavigationItem;
  isActive: boolean;
  isDarkMode: boolean;
  isBeingEdited: boolean;
  editingPageTitle: string;
  isDragging: boolean;
  onPageClick: (pageId: string) => void;
  onTitleChange: (title: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditPage: (pageId: string, title: string) => void;
  onDeletePage: (pageId: string, title: string) => void;
  isAdmin: () => boolean;
  showPageMenu: string | null;
  setShowPageMenu: (menu: string | null) => void;
}

export const DraggableCategory: React.FC<DraggableCategoryProps> = ({
  item,
  isActive,
  isDarkMode,
  isBeingEdited,
  editingPageTitle,
  isDragging,
  onPageClick,
  onTitleChange,
  onSaveEdit,
  onCancelEdit,
  onEditPage,
  onDeletePage,
  isAdmin,
  showPageMenu,
  setShowPageMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const shouldShowDragHandle = isHovered || isDragging;

  return (
    <li 
      ref={setNodeRef} 
      style={style}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            onChange={(e) => onTitleChange(e.target.value)}
            className={`flex-1 px-2 py-1 text-sm rounded border-0 bg-transparent focus:outline-none ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
          />
          <div className="flex space-x-1">
            <button
              onClick={onSaveEdit}
              className={`p-1 rounded hover:bg-green-600 text-green-400 hover:text-white transition-colors`}
              title="Sauvegarder"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={onCancelEdit}
              className={`p-1 rounded hover:bg-red-600 text-red-400 hover:text-white transition-colors`}
              title="Annuler"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        // Mode normal
        <div className="flex items-center group">
          {/* Drag Handle */}
          <div 
            className={`flex items-center justify-center w-6 transition-opacity duration-200 ${
              shouldShowDragHandle ? 'opacity-100' : 'opacity-0'
            }`}
            {...attributes}
            {...listeners}
          >
            <DragHandle isDarkMode={isDarkMode} />
          </div>
          
          <button
            onClick={() => onPageClick(item.id)}
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
          
          {/* Options d'administration pour toutes les pages */}
          {isAdmin() && (
            <div className="relative">
              <button
                onClick={() => setShowPageMenu(showPageMenu === item.id ? null : item.id)}
                className={`p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                  isDarkMode 
                    ? 'hover:bg-slate-600 text-slate-400 hover:text-slate-300' 
                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }`}
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {/* Menu déroulant */}
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
                      onClick={() => onEditPage(item.id, item.label)}
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
                      onClick={() => onDeletePage(item.id, item.label)}
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

export default DraggableCategory;
