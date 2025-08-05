import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

export interface User {
  id: number;
  username: string;
  password: string;
  tags: string; // Stocké comme string JSON dans la DB
  createdAt: string;
  updatedAt: string;
}

export interface UserForContext {
  id: number;
  username: string;
  tags: string[];
}

class WikiDatabase {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'wiki.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    // Créer la table des utilisateurs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer les utilisateurs par défaut s'ils n'existent pas
    this.createDefaultUsers();
  }

  private createDefaultUsers() {
    const users = [
      { username: 'admin', password: 'admin123', tags: ['Administrateur'] },
      { username: 'contributeur1', password: 'contrib123', tags: ['Contributeur'] },
      { username: 'visiteur1', password: 'visit123', tags: ['Visiteur'] }
    ];

    const existingUsers = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (existingUsers.count === 0) {
      const insertUser = this.db.prepare(`
        INSERT INTO users (username, password, tags) 
        VALUES (?, ?, ?)
      `);

      users.forEach(user => {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        insertUser.run(user.username, hashedPassword, JSON.stringify(user.tags));
      });

      console.log('✅ Utilisateurs par défaut créés');
    }
  }

  // Authentification
  authenticate(username: string, password: string): UserForContext | null {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
    
    if (user && bcrypt.compareSync(password, user.password)) {
      return {
        id: user.id,
        username: user.username,
        tags: JSON.parse(user.tags)
      };
    }
    
    return null;
  }

  // Récupérer tous les utilisateurs (pour l'admin)
  getAllUsers(): UserForContext[] {
    const users = this.db.prepare('SELECT * FROM users ORDER BY username').all() as User[];
    return users.map(user => ({
      id: user.id,
      username: user.username,
      tags: JSON.parse(user.tags)
    }));
  }

  // Mettre à jour les tags d'un utilisateur
  updateUserTags(userId: number, tags: string[]): boolean {
    try {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET tags = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      const result = stmt.run(JSON.stringify(tags), userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tags:', error);
      return false;
    }
  }

  // Créer un nouvel utilisateur
  createUser(username: string, password: string, tags: string[] = ['Visiteur']): UserForContext | null {
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const stmt = this.db.prepare(`
        INSERT INTO users (username, password, tags) 
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(username, hashedPassword, JSON.stringify(tags));
      
      if (result.lastInsertRowid) {
        return {
          id: result.lastInsertRowid as number,
          username,
          tags
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return null;
    }
  }

  // Supprimer un utilisateur
  deleteUser(userId: number): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
      const result = stmt.run(userId);
      return result.changes > 0;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return false;
    }
  }

  // Fermer la base de données
  close() {
    this.db.close();
  }
}

// Instance singleton
let dbInstance: WikiDatabase | null = null;

export const getDatabase = (): WikiDatabase => {
  if (!dbInstance) {
    dbInstance = new WikiDatabase();
  }
  return dbInstance;
};

export default WikiDatabase;
