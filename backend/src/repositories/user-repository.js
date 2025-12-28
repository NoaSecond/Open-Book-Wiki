const BaseRepository = require('./base-repository');
const bcrypt = require('bcryptjs');

class UserRepository extends BaseRepository {
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
}

module.exports = UserRepository;
