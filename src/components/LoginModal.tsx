import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setUser, setIsLoggedIn, isDarkMode, allUsers } = useWiki();
  const [selectedUser, setSelectedUser] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUser) {
      const user = allUsers.find(u => u.username === selectedUser);
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        onClose();
        setSelectedUser('');
      }
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return 'bg-red-500';
      case 'Contributeur':
        return 'bg-blue-500';
      case 'Visiteur':
        return 'bg-gray-500';
      default:
        return 'bg-slate-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-xl w-96 max-w-90vw ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Choisir un compte de test
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Sélectionnez un utilisateur pour tester les permissions :
            </p>
            
            {allUsers.map((user) => (
              <label
                key={user.username}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUser === user.username
                    ? isDarkMode 
                      ? 'bg-blue-600/20 border-blue-500' 
                      : 'bg-blue-50 border-blue-500'
                    : isDarkMode
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="user"
                  value={user.username}
                  checked={selectedUser === user.username}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3 w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user.username}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedUser}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};