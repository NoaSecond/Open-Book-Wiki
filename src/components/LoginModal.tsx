import React, { useState } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setUser, setIsLoggedIn, isDarkMode } = useWiki();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulation d'une connexion réussie
    const userData = {
      username: formData.username || 'Utilisateur',
      email: formData.email || 'user@example.com',
      bio: '',
      joinDate: new Date().toISOString().split('T')[0],
      contributions: 0
    };
    
    if (isLogin) {
      // Connexion - on peut simuler la récupération d'un utilisateur existant
      setUser({
        ...userData,
        contributions: Math.floor(Math.random() * 20) + 1, // Simule des contributions existantes
        joinDate: '2024-01-15' // Date d'inscription simulée
      });
    } else {
      // Inscription - nouvel utilisateur
      setUser(userData);
    }
    
    setIsLoggedIn(true);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-md mx-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? 'Se connecter' : 'S\'inscrire'}
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Nom d'utilisateur
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-slate-700 text-white border-slate-600' 
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                }`}
                placeholder="Votre nom d'utilisateur"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required={!isLogin}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-slate-700 text-white border-slate-600' 
                      : 'bg-gray-100 text-gray-900 border-gray-300'
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              Mot de passe
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-slate-700 text-white border-slate-600' 
                    : 'bg-gray-100 text-gray-900 border-gray-300'
                }`}
                placeholder="Votre mot de passe"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-slate-700 text-white border-slate-600' 
                      : 'bg-gray-100 text-gray-900 border-gray-300'
                  }`}
                  placeholder="Confirmez votre mot de passe"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLogin ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          >
            {isLogin 
              ? "Pas encore de compte ? S'inscrire" 
              : "Déjà un compte ? Se connecter"
            }
          </button>
        </div>
      </div>
    </div>
  );
};
