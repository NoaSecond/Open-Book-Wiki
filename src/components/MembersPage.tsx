import React, { useState } from 'react';
import { Users, Edit3, Tag, Calendar, Trophy, Shield, UserCheck, Eye } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

export const MembersPage: React.FC = () => {
  const { allUsers, updateUserTags, isAdmin, isDarkMode } = useWiki();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = ['Visiteur', 'Contributeur', 'Administrateur'];

  const handleEditTags = (username: string, currentTags: string[]) => {
    setEditingUser(username);
    setSelectedTags([...currentTags]);
  };

  const handleSaveTags = () => {
    if (editingUser) {
      updateUserTags(editingUser, selectedTags);
      setEditingUser(null);
      setSelectedTags([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return isDarkMode ? 'bg-red-600' : 'bg-red-500';
      case 'Contributeur':
        return isDarkMode ? 'bg-blue-600' : 'bg-blue-500';
      case 'Visiteur':
        return isDarkMode ? 'bg-gray-600' : 'bg-gray-500';
      default:
        return isDarkMode ? 'bg-slate-600' : 'bg-slate-500';
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return <Shield className="w-3 h-3" />;
      case 'Contributeur':
        return <UserCheck className="w-3 h-3" />;
      case 'Visiteur':
        return <Eye className="w-3 h-3" />;
      default:
        return <Tag className="w-3 h-3" />;
    }
  };

  if (!isAdmin()) {
    return (
      <main className={`flex-1 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto p-6">
          <div className={`text-center py-12 rounded-lg ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <Shield className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            <h2 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Accès restreint
            </h2>
            <p className={`${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              Seuls les administrateurs peuvent accéder à la gestion des membres.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex-1 content-scrollbar overflow-y-auto ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className={`mb-6 pb-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3 mb-4">
            <Users className={`w-8 h-8 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Gestion des Membres
            </h1>
          </div>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Gérez les rôles et permissions des membres du wiki
          </p>
        </div>

        {/* Liste des membres */}
        <div className="space-y-4">
          {allUsers.map((user) => (
            <div
              key={user.username}
              className={`p-6 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user.username}
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                      >
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>

                  {/* Bouton d'édition */}
                  <button
                    onClick={() => handleEditTags(user.username, user.tags)}
                    className={`p-2 rounded-md transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-700 text-slate-300' 
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    title="Modifier les tags"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className={`mt-4 flex items-center space-x-6 text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis le {user.joinDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span>{user.contributions} contributions</span>
                </div>
              </div>

              {user.bio && (
                <div className={`mt-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {user.bio}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal d'édition des tags */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-90vw">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Modifier les tags de {editingUser}
            </h2>
            
            <div className="space-y-3 mb-6">
              {availableTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium text-white ${getTagColor(tag)}`}>
                    {getTagIcon(tag)}
                    <span>{tag}</span>
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveTags}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
