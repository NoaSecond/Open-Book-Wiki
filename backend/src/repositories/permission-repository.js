const BaseRepository = require('./base-repository');

class PermissionRepository extends BaseRepository {
    async getAllPermissions() {
        return await this.db.all(`
      SELECT p.*, 
        COUNT(tp.tag_id) as tag_count
      FROM permissions p
      LEFT JOIN tag_permissions tp ON p.id = tp.permission_id
      GROUP BY p.id
      ORDER BY p.category, p.name
    `);
    }

    async getPermissionById(id) {
        return await this.db.get('SELECT * FROM permissions WHERE id = ?', [id]);
    }

    async getPermissionByName(name) {
        return await this.db.get('SELECT * FROM permissions WHERE name = ?', [name]);
    }

    async getPermissionByNameExcludingId(name, excludeId) {
        return await this.db.get('SELECT * FROM permissions WHERE name = ? AND id != ?', [name, excludeId]);
    }

    async createPermission(name, description, category) {
        const result = await this.db.run(
            'INSERT INTO permissions (name, description, category) VALUES (?, ?, ?)',
            [name, description, category || 'general']
        );
        return result.lastID;
    }

    async updatePermission(id, name, description, category) {
        await this.db.run(
            'UPDATE permissions SET name = ?, description = ?, category = ? WHERE id = ?',
            [name, description, category, id]
        );
        return await this.getPermissionById(id);
    }

    async deletePermission(id) {
        await this.db.run('DELETE FROM permissions WHERE id = ?', [id]);
    }
}

module.exports = PermissionRepository;
