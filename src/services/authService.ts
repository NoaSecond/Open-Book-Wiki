// Service d'authentification simulant une base de données
// En production, ceci communiquerait avec un vrai backend

export interface User {
  id: number;
  username: string;
  tags: string[];
  email?: string;
  avatar?: string;
}

interface StoredUser {
  id: number;
  username: string;
  password: string;
  tags: string[];
  email?: string;
  avatar?: string;
}

// Simulation d'une base de données locale (localStorage)
class AuthService {
  private storageKey = 'wiki_users';
  private sessionKey = 'wiki_session';

  constructor() {
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    const existingUsers = this.getStoredUsers();
    if (existingUsers.length === 0) {
      const defaultUsers: StoredUser[] = [
        {
          id: 1,
          username: 'admin',
          password: 'admin', // En production, ce serait hashé
          tags: ['Administrateur', 'Contributeur'],
          email: 'admin@stardeception.com',
          avatar: undefined
        },
        {
          id: 2,
          username: 'contributeur1',
          password: 'contrib123',
          tags: ['Contributeur'],
          email: 'contrib@stardeception.com',
          avatar: undefined
        },
        {
          id: 3,
          username: 'visiteur1',
          password: 'visit123',
          tags: ['Visiteur'],
          email: 'visitor@stardeception.com',
          avatar: undefined
        }
      ];
      
      localStorage.setItem(this.storageKey, JSON.stringify(defaultUsers));
      console.log('✅ Utilisateurs par défaut créés');
    }
  }

  private getStoredUsers(): StoredUser[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUsers(users: StoredUser[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(users));
  }

  // Authentification
  async authenticate(username: string, password: string): Promise<User | null> {
    const users = this.getStoredUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      const userSession: User = {
        id: user.id,
        username: user.username,
        tags: user.tags
      };
      
      // Sauvegarder la session
      localStorage.setItem(this.sessionKey, JSON.stringify(userSession));
      return userSession;
    }
    
    return null;
  }

  // Récupérer la session actuelle
  getCurrentUser(): User | null {
    const session = localStorage.getItem(this.sessionKey);
    return session ? JSON.parse(session) : null;
  }

  // Déconnexion
  logout() {
    localStorage.removeItem(this.sessionKey);
  }

  // Récupérer tous les utilisateurs (pour l'admin)
  getAllUsers(): User[] {
    const users = this.getStoredUsers();
    return users.map(user => ({
      id: user.id,
      username: user.username,
      tags: user.tags,
      email: user.email,
      avatar: user.avatar
    }));
  }

  // Mettre à jour les tags d'un utilisateur
  updateUserTags(userId: number, tags: string[]): boolean {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].tags = tags;
        this.saveUsers(users);
        
        // Mettre à jour la session si c'est l'utilisateur connecté
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const updatedSession = { ...currentUser, tags };
          localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tags:', error);
      return false;
    }
  }

  // Mettre à jour complètement un utilisateur
  updateUser(userId: number, updates: {
    username?: string;
    email?: string;
    avatar?: string;
    tags?: string[];
    password?: string;
  }): boolean {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // Vérifier si le nom d'utilisateur n'existe pas déjà (sauf pour le même utilisateur)
        if (updates.username && users.some(u => u.username === updates.username && u.id !== userId)) {
          return false; // Nom d'utilisateur déjà pris
        }

        const user = users[userIndex];
        if (updates.username !== undefined) user.username = updates.username;
        if (updates.email !== undefined) user.email = updates.email;
        if (updates.avatar !== undefined) user.avatar = updates.avatar;
        if (updates.tags !== undefined) user.tags = updates.tags;
        if (updates.password !== undefined) user.password = updates.password;

        this.saveUsers(users);
        
        // Mettre à jour la session si c'est l'utilisateur connecté
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const updatedSession: User = {
            id: user.id,
            username: user.username,
            tags: user.tags,
            email: user.email,
            avatar: user.avatar
          };
          localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      return false;
    }
  }

  // Créer un nouvel utilisateur
  createUser(username: string, password: string, tags: string[] = ['Visiteur']): User | null {
    try {
      const users = this.getStoredUsers();
      
      // Vérifier si l'utilisateur existe déjà
      if (users.some(u => u.username === username)) {
        return null;
      }
      
      const newUser: StoredUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        username,
        password,
        tags
      };
      
      users.push(newUser);
      this.saveUsers(users);
      
      return {
        id: newUser.id,
        username: newUser.username,
        tags: newUser.tags
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return null;
    }
  }

  // Supprimer un utilisateur
  deleteUser(userId: number): boolean {
    try {
      const users = this.getStoredUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      
      if (filteredUsers.length < users.length) {
        this.saveUsers(filteredUsers);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return false;
    }
  }

  // Vérifier si un utilisateur est connecté
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

// Instance singleton
const authService = new AuthService();
export default authService;
