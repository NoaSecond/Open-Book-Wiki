import React, { useState } from 'react';
import SvgIcon from '../svg-icon';
import { useWiki } from '../../context/wiki-context';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (categoryName: string, iconIndex: number) => Promise<void>;
    availableIcons: Array<{ name: string; label: string }>;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    availableIcons
}) => {
    const { isDarkMode } = useWiki();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIconIndex, setSelectedIconIndex] = useState(0);

    const handleCreate = async () => {
        if (newCategoryName.trim()) {
            await onCreate(newCategoryName, selectedIconIndex);
            setNewCategoryName('');
            setSelectedIconIndex(0);
        }
    };

    const handleCancel = () => {
        setNewCategoryName('');
        setSelectedIconIndex(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg shadow-xl w-96 max-w-90vw max-h-80vh overflow-y-auto ${isDarkMode ? 'bg-slate-800' : 'bg-white'
                }`}>
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    Ajouter une nouvelle catégorie
                </h2>

                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la catégorie..."
                    className={`w-full p-3 border rounded-lg mb-4 ${isDarkMode
                        ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                        }`}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleCreate();
                        } else if (e.key === 'Escape') {
                            handleCancel();
                        }
                    }}
                />

                <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                        Choisir une icône :
                    </label>
                    <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                        {availableIcons.map((iconData, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedIconIndex(index)}
                                className={`p-2 rounded-lg transition-colors border-2 ${selectedIconIndex === index
                                    ? 'border-cyan-500 bg-cyan-500/20'
                                    : isDarkMode
                                        ? 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                title={iconData.label}
                            >
                                <SvgIcon
                                    name={iconData.name}
                                    className={`w-5 h-5 ${selectedIconIndex === index
                                        ? 'text-cyan-400'
                                        : isDarkMode
                                            ? 'text-slate-400'
                                            : 'text-gray-600'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleCancel}
                        className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode
                            ? 'bg-slate-600 text-white hover:bg-slate-500'
                            : 'bg-gray-500 text-white hover:bg-gray-600'
                            }`}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!newCategoryName.trim()}
                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Créer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;
