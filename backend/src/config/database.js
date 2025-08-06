const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/openbookwiki.db');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          // Promisify the database methods
          this.db.run = promisify(this.db.run.bind(this.db));
          this.db.get = promisify(this.db.get.bind(this.db));
          this.db.all = promisify(this.db.all.bind(this.db));
          resolve();
        }
      });
    });
  }

  async initializeTables() {
    try {
      // Create users table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT FALSE,
          avatar TEXT DEFAULT 'avatar-openbookwiki.svg',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `);

      // Create activities table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create wiki_pages table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS wiki_pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          author_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_protected BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (author_id) REFERENCES users (id)
        )
      `);

      // Create indexes
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_wiki_pages_title ON wiki_pages (title)');

      console.log('Database tables initialized successfully');
      
      // Seed default data
      await this.seedDefaultData();
      
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  async seedDefaultData() {
    try {
      // Check if admin user exists
      const adminUser = await this.db.get('SELECT * FROM users WHERE username = ?', ['admin']);
      
      if (!adminUser) {
        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await this.db.run(
          'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
          ['admin', 'admin@openbookwiki.com', hashedPassword, true]
        );

        // Get the admin user ID
        const newAdmin = await this.db.get('SELECT * FROM users WHERE username = ?', ['admin']);

        // Create welcome activity for admin
        await this.db.run(
          'INSERT INTO activities (user_id, type, title, description, icon) VALUES (?, ?, ?, ?, ?)',
          [
            newAdmin.id,
            'system',
            'Welcome to Open Book Wiki!',
            'Your admin account has been created successfully.',
            'shield'
          ]
        );

        console.log('Default admin user created successfully');
        console.log('Login credentials: admin / admin123');
      }
    } catch (error) {
      console.error('Error seeding default data:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      });
    }
  }

  // User management methods
  async createUser(userData) {
    const { username, email, password, isAdmin = false, avatar = 'avatar-openbookwiki.svg' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await this.db.run(
      'INSERT INTO users (username, email, password_hash, is_admin, avatar) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, isAdmin, avatar]
    );
    
    return result.lastID;
  }

  async findUserByUsername(username) {
    return await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
  }

  async findUserByEmail(email) {
    return await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async findUserById(id) {
    return await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateLastLogin(userId) {
    await this.db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  // Activity management methods
  async createActivity(activityData) {
    const { userId, type, title, description, icon, metadata } = activityData;
    const result = await this.db.run(
      'INSERT INTO activities (user_id, type, title, description, icon, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, title, description, icon, JSON.stringify(metadata || {})]
    );
    
    return result.lastID;
  }

  async getActivitiesByUser(userId, limit = 50, offset = 0) {
    return await this.db.all(
      'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
  }

  async getTodayActivitiesByUser(userId) {
    return await this.db.all(
      'SELECT * FROM activities WHERE user_id = ? AND DATE(created_at) = DATE("now") ORDER BY created_at DESC',
      [userId]
    );
  }

  async searchActivities(userId, searchTerm, limit = 50) {
    const term = `%${searchTerm}%`;
    return await this.db.all(
      'SELECT * FROM activities WHERE user_id = ? AND (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC LIMIT ?',
      [userId, term, term, limit]
    );
  }

  async getAllActivities(limit = 100, offset = 0) {
    return await this.db.all(`
      SELECT a.*, u.username 
      FROM activities a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  }

  // Wiki pages management methods
  async createWikiPage(pageData) {
    const { title, content, authorId, isProtected = false } = pageData;
    const result = await this.db.run(
      'INSERT INTO wiki_pages (title, content, author_id, is_protected) VALUES (?, ?, ?, ?)',
      [title, content, authorId, isProtected]
    );
    
    return result.lastID;
  }

  async findWikiPageByTitle(title) {
    return await this.db.get('SELECT * FROM wiki_pages WHERE title = ?', [title]);
  }

  async getAllWikiPages() {
    return await this.db.all(`
      SELECT w.*, u.username as author_username 
      FROM wiki_pages w 
      JOIN users u ON w.author_id = u.id 
      ORDER BY w.updated_at DESC
    `);
  }

  async updateWikiPage(id, content) {
    await this.db.run(
      'UPDATE wiki_pages SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, id]
    );
  }
}

module.exports = DatabaseManager;
