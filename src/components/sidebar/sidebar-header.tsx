import React from 'react';
import { Plus } from 'lucide-react';
import { useWiki } from '../../context/wiki-context';

interface SidebarHeaderProps {
    onAddCategory: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onAddCategory }) => {
    const { isDarkMode, hasPermission } = useWiki();

    return (
        <div className="p-4 flex-shrink-0">
            <h2 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Navigation
            </h2>

            {/* Add Category Button */}
            {hasPermission('create_pages') && (
                <div className="mb-4">
                    <button
                        onClick={onAddCategory}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg border-2 border-dashed transition-colors ${isDarkMode
                            ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                    >
                        <Plus className="w-5 h-5" />
                        <span>Ajouter une catégorie</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SidebarHeader;
