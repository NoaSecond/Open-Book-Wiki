import React from 'react';
import { Search, Edit3, Save, X } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

export const Header: React.FC = () => {
  const { searchTerm, setSearchTerm, isEditing, setIsEditing, currentPage } = useWiki();

  return (
    <header className="bg-slate-800 shadow-lg border-b border-slate-700">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SD</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Star Deception Wiki</h1>
                <p className="text-slate-400 text-sm">Guide complet du jeu</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans le wiki..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64"
              />
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};