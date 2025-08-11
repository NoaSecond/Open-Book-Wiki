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
          // Sauvegarder la méthode originale
          const originalRun = this.db.run.bind(this.db);
          
          // Promisify the database methods avec support pour lastID
          this.db.run = function(sql, params = []) {
            return new Promise((resolve, reject) => {
              originalRun(sql, params, function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve({ lastID: this.lastID, changes: this.changes });
                }
              });
            });
          };
          
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
          avatar TEXT DEFAULT '/avatars/avatar-openbookwiki.svg',
          bio TEXT DEFAULT '',
          tags TEXT DEFAULT '',
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

      // Create tags table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          color TEXT NOT NULL DEFAULT '#3B82F6',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create permissions table
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          category TEXT DEFAULT 'general',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create tag_permissions table (many-to-many relationship)
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS tag_permissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tag_id INTEGER NOT NULL,
          permission_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
          UNIQUE(tag_id, permission_id)
        )
      `);

      // Create indexes
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities (user_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_wiki_pages_title ON wiki_pages (title)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions (name)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_tag_permissions_tag_id ON tag_permissions (tag_id)');
      await this.db.run('CREATE INDEX IF NOT EXISTS idx_tag_permissions_permission_id ON tag_permissions (permission_id)');

      console.log('Database tables initialized successfully');
      
      // Migrate existing tables if needed
      await this.migrateDatabase();
      
      // Seed default data
      await this.seedDefaultData();
      
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  async migrateDatabase() {
    try {
      // Check if bio and tags columns exist
      const tableInfo = await this.db.all("PRAGMA table_info(users)");
      const columns = tableInfo.map(col => col.name);
      
      if (!columns.includes('bio')) {
        await this.db.run('ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ""');
        console.log('Added bio column to users table');
      }
      
      if (!columns.includes('tags')) {
        await this.db.run('ALTER TABLE users ADD COLUMN tags TEXT DEFAULT ""');
        console.log('Added tags column to users table');
      }
    } catch (error) {
      console.error('Error during database migration:', error);
      // Continue even if migration fails for non-critical columns
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
          'INSERT INTO users (username, email, password_hash, is_admin, avatar, bio, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            'admin', 
            'admin@openbookwiki.com', 
            hashedPassword, 
            true, 
            '/avatars/avatar-openbookwiki.svg',
            'Administrateur principal du wiki Open Book Wiki.',
            'Administrateur'
          ]
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

      // Create test users if they don't exist
      const contributorUser = await this.db.get('SELECT * FROM users WHERE username = ?', ['contributeur']);
      if (!contributorUser) {
        const hashedPassword = await bcrypt.hash('contrib123', 10);
        
        await this.db.run(
          'INSERT INTO users (username, email, password_hash, is_admin, avatar, bio, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            'contributeur', 
            'contributeur@openbookwiki.com', 
            hashedPassword, 
            false, 
            '/avatars/avatar-blue.svg',
            'Utilisateur contributeur qui peut créer et modifier des articles.',
            'Contributeur'
          ]
        );

        console.log('Test contributor user created successfully');
        console.log('Login credentials: contributeur / contrib123');
      }

      const visitorUser = await this.db.get('SELECT * FROM users WHERE username = ?', ['visiteur']);
      if (!visitorUser) {
        const hashedPassword = await bcrypt.hash('visit123', 10);
        
        await this.db.run(
          'INSERT INTO users (username, email, password_hash, is_admin, avatar, bio, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            'visiteur', 
            'visiteur@openbookwiki.com', 
            hashedPassword, 
            false, 
            '/avatars/avatar-green.svg',
            'Utilisateur visiteur avec accès en lecture seule.',
            'Visiteur'
          ]
        );

        console.log('Test visitor user created successfully');
        console.log('Login credentials: visiteur / visit123');
      }
      
      // Check if default pages exist
      const pageCount = await this.db.get('SELECT COUNT(*) as count FROM wiki_pages');
      
      if (pageCount.count === 0) {
        // Create default pages
        const adminUser = await this.db.get('SELECT * FROM users WHERE username = ?', ['admin']);
        
        const defaultPages = [
          {
            title: 'Accueil',
            content: `# Bienvenue sur Open Book Wiki !

Votre wiki personnel est maintenant opérationnel ! 🎉

## Qu'est-ce qu'Open Book Wiki ?

Open Book Wiki est une plateforme de documentation collaborative, simple et moderne. Elle vous permet de créer, organiser et partager vos connaissances facilement.

## Comment commencer ?

### 1. 🔐 Authentification
- Cliquez sur "Se connecter" dans le coin supérieur droit
- Utilisez les identifiants : **admin** / **admin123**
- Une fois connecté, vous aurez accès aux fonctionnalités d'édition

### 2. ✏️ Créer du contenu
- Cliquez sur "Modifier" en haut à droite de cette page pour l'éditer
- Utilisez le bouton "+" dans la barre latérale pour créer de nouvelles pages
- Organisez vos pages par catégories

### 3. 🎨 Personnalisation
- Basculez entre mode sombre et clair avec l'interrupteur en haut
- Accédez au panel d'administration pour gérer les utilisateurs
- Configurez les paramètres selon vos besoins

## Fonctionnalités principales

- ✏️ **Édition Markdown** : Syntaxe simple et puissante
- 🔍 **Recherche** : Trouvez rapidement vos contenus
- 👥 **Multi-utilisateurs** : Collaboration en équipe
- 🔒 **Pages protégées** : Contrôlez l'accès au contenu sensible
- 📊 **Suivi d'activité** : Historique des modifications
- 🌙 **Mode sombre** : Interface adaptée à vos préférences
- 📱 **Responsive** : Fonctionne sur tous les appareils

## Syntaxe Markdown

Voici quelques exemples de syntaxe Markdown que vous pouvez utiliser :

\`\`\`markdown
# Titre de niveau 1
## Titre de niveau 2
### Titre de niveau 3

**Texte en gras**
*Texte en italique*
\`Code en ligne\`

- Liste à puces
- Élément 2
- Élément 3

1. Liste numérotée
2. Élément 2
3. Élément 3

[Lien vers une page](https://example.com)

> Citation
> Sur plusieurs lignes
\`\`\`

## Support et ressources

- 📖 [Documentation Markdown](https://www.markdownguide.org/)
- 🐛 [Rapporter un bug](mailto:admin@openbookwiki.com)
- 💡 [Suggérer une amélioration](mailto:admin@openbookwiki.com)

---

*Bon wiki ! 🚀*`,
            author_id: adminUser.id,
            is_protected: false
          },
          {
            title: 'Démarrage',
            content: `# Guide de démarrage rapide

Ce guide vous aidera à prendre en main Open Book Wiki rapidement.

## Étape 1 : Connexion

1. Cliquez sur le bouton "Se connecter" en haut à droite
2. Saisissez vos identifiants :
   - **Nom d'utilisateur** : admin
   - **Mot de passe** : admin123
3. Cliquez sur "Connexion"

## Étape 2 : Navigation

### Barre latérale
- **Accueil** : Page principale du wiki
- **Catégories** : Organisez vos pages par thèmes
- **Bouton +** : Créer une nouvelle page

### Barre supérieure
- **Recherche** : Trouvez rapidement une page
- **Mode sombre/clair** : Changez l'apparence
- **Menu utilisateur** : Profil et déconnexion

## Étape 3 : Création de contenu

### Créer une nouvelle page
1. Cliquez sur le bouton "+" dans la barre latérale
2. Donnez un titre à votre page
3. Rédigez le contenu en Markdown
4. Cliquez sur "Sauvegarder"

### Modifier une page existante
1. Naviguez vers la page à modifier
2. Cliquez sur "Modifier" en haut à droite
3. Apportez vos modifications
4. Sauvegardez vos changements

## Étape 4 : Organisation

### Catégories
Organisez vos pages en catégories logiques :
- Documentation technique
- Guides utilisateur
- Procédures internes
- FAQ
- Notes personnelles

### Pages protégées
Certaines pages peuvent être protégées contre la modification par des utilisateurs non-autorisés.

## Conseils d'utilisation

### Syntaxe Markdown utile
- \`# Titre\` pour les titres principaux
- \`## Sous-titre\` pour les sous-sections
- \`**gras**\` pour mettre en évidence
- \`\`code\`\` pour le code en ligne
- \`- élément\` pour les listes

### Bonnes pratiques
- Utilisez des titres clairs et descriptifs
- Organisez le contenu avec des sous-sections
- Ajoutez des liens entre les pages liées
- Maintenez vos pages à jour

---

Vous êtes maintenant prêt à utiliser Open Book Wiki ! 🎉`,
            author_id: adminUser.id,
            is_protected: false
          }
        ];
        
        for (const page of defaultPages) {
          await this.db.run(
            'INSERT INTO wiki_pages (title, content, author_id, is_protected) VALUES (?, ?, ?, ?)',
            [page.title, page.content, page.author_id, page.is_protected]
          );
          
          // Add activity log for page creation
          await this.db.run(
            'INSERT INTO activities (user_id, type, title, description, icon) VALUES (?, ?, ?, ?, ?)',
            [
              page.author_id,
              'create',
              'Page "' + page.title + '" créée',
              'Création de la page par défaut "' + page.title + '"',
              'book-open'
            ]
          );
        }
        
        console.log('Default wiki pages created successfully');
      }
      
      // Create default tags if they don't exist
      const tagCount = await this.db.get('SELECT COUNT(*) as count FROM tags');
      
      if (tagCount.count === 0) {
        const defaultTags = [
          { name: 'Administrateur', color: '#DC2626' }, // Rouge
          { name: 'Contributeur', color: '#2563EB' },   // Bleu
          { name: 'Visiteur', color: '#6B7280' }        // Gris
        ];
        
        for (const tag of defaultTags) {
          await this.db.run(
            'INSERT INTO tags (name, color) VALUES (?, ?)',
            [tag.name, tag.color]
          );
        }
        
        console.log('Default tags created successfully');
      }

      // Create default permissions if they don't exist
      const permissionCount = await this.db.get('SELECT COUNT(*) as count FROM permissions');
      
      if (permissionCount.count === 0) {
        const defaultPermissions = [
          // Admin permissions
          { name: 'admin_panel_access', description: 'Accès au panel d\'administration', category: 'admin' },
          { name: 'user_management', description: 'Gestion des utilisateurs', category: 'admin' },
          { name: 'tag_management', description: 'Gestion des tags', category: 'admin' },
          { name: 'permission_management', description: 'Gestion des permissions', category: 'admin' },
          { name: 'database_management', description: 'Gestion de la base de données', category: 'admin' },
          { name: 'view_activity_admin', description: 'Voir l\'activité (admin)', category: 'admin' },

          // Pages
          { name: 'create_pages', description: 'Créer des pages', category: 'pages' },
          { name: 'edit_pages', description: 'Modifier des pages', category: 'pages' },
          { name: 'delete_pages', description: 'Supprimer des pages', category: 'pages' },
          { name: 'protect_pages', description: 'Protéger/déprotéger des pages', category: 'pages' },
          { name: 'reorder_pages', description: 'Réorganiser les pages', category: 'pages' },

          // Sections
          { name: 'create_sections', description: 'Créer des sections', category: 'sections' },
          { name: 'delete_sections', description: 'Supprimer des sections', category: 'sections' },
          { name: 'edit_sections', description: 'Modifier des sections', category: 'sections' },
          { name: 'reorder_sections', description: 'Réorganiser les sections', category: 'sections' },

          // User permissions
          { name: 'edit_own_profile', description: 'Modifier son propre profil', category: 'user' },
          { name: 'change_avatar', description: 'Changer son avatar', category: 'user' },
          { name: 'view_activity', description: 'Voir l\'activité', category: 'user' }
        ];
        
        for (const permission of defaultPermissions) {
          await this.db.run(
            'INSERT INTO permissions (name, description, category) VALUES (?, ?, ?)',
            [permission.name, permission.description, permission.category]
          );
        }
        
        console.log('Default permissions created successfully');
      }

      // Create default tag permissions if they don't exist
      const tagPermissionCount = await this.db.get('SELECT COUNT(*) as count FROM tag_permissions');
      
      if (tagPermissionCount.count === 0) {
        // Get tag and permission IDs
        const adminTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Administrateur']);
        const contributorTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Contributeur']);
        const visitorTag = await this.db.get('SELECT id FROM tags WHERE name = ?', ['Visiteur']);
        
        const allPermissions = await this.db.all('SELECT id, name FROM permissions');
        const permissionMap = {};
        allPermissions.forEach(p => permissionMap[p.name] = p.id);
        
        // Admin permissions (all permissions)
        if (adminTag) {
          for (const permission of allPermissions) {
            await this.db.run(
              'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
              [adminTag.id, permission.id]
            );
          }
        }
        
        // Contributor permissions (user permissions + edit pages)
        if (contributorTag) {
          const contributorPermissions = [
            'edit_pages', 'edit_own_profile', 'change_avatar', 'view_activity'
          ];
          
          for (const permName of contributorPermissions) {
            if (permissionMap[permName]) {
              await this.db.run(
                'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
                [contributorTag.id, permissionMap[permName]]
              );
            }
          }
        }
        
        // Visitor permissions (user permissions only)
        if (visitorTag) {
          const visitorPermissions = [
            'edit_own_profile', 'change_avatar', 'view_activity'
          ];
          
          for (const permName of visitorPermissions) {
            if (permissionMap[permName]) {
              await this.db.run(
                'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
                [visitorTag.id, permissionMap[permName]]
              );
            }
          }
        }
        
        console.log('Default tag permissions created successfully');
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
    const { username, email, password, isAdmin = false, avatar = '/avatars/avatar-openbookwiki.svg' } = userData;
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

  async getAllUsers() {
    return await this.db.all(`
      SELECT id, username, email, is_admin, avatar, bio, tags, created_at, last_login 
      FROM users 
      ORDER BY created_at DESC
    `);
  }

  async getUserById(userId) {
    return await this.db.get(`
      SELECT id, username, email, is_admin, avatar, bio, tags, created_at, last_login 
      FROM users 
      WHERE id = ?
    `, [userId]);
  }

  async updateUserProfile(userId, updates) {
    const allowedFields = ['username', 'email', 'avatar', 'bio', 'tags'];
    const fields = [];
    const values = [];
    
    // Construire la requête dynamiquement avec uniquement les champs autorisés
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }
    
    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    await this.db.run(query, values);
    return await this.findUserById(userId);
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

  async renameWikiPage(id, newTitle) {
    await this.db.run(
      'UPDATE wiki_pages SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newTitle, id]
    );
  }

  async findWikiPageById(id) {
    return await this.db.get(`
      SELECT w.*, u.username as author_username 
      FROM wiki_pages w 
      JOIN users u ON w.author_id = u.id 
      WHERE w.id = ?
    `, [id]);
  }

  // Tags management methods
  async getAllTags() {
    return await this.db.all(`
      SELECT * FROM tags 
      ORDER BY name ASC
    `);
  }

  async createTag(name, color) {
    const result = await this.db.run(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name, color]
    );
    return result.lastID;
  }

  async updateTag(id, name, color) {
    await this.db.run(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [name, color, id]
    );
    return await this.db.get('SELECT * FROM tags WHERE id = ?', [id]);
  }

  async deleteTag(id) {
    await this.db.run('DELETE FROM tags WHERE id = ?', [id]);
  }

  async getTagById(id) {
    return await this.db.get('SELECT * FROM tags WHERE id = ?', [id]);
  }
}

module.exports = DatabaseManager;
