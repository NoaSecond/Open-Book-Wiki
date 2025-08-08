const express = require('express');
const router = express.Router();
const DatabaseManager = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const db = new DatabaseManager();

// Get all permissions
router.get('/', requireAuth, async (req, res) => {
  try {
    await db.connect();
    
    const permissions = await db.db.all(`
      SELECT p.*, 
        COUNT(tp.tag_id) as tag_count
      FROM permissions p
      LEFT JOIN tag_permissions tp ON p.id = tp.permission_id
      GROUP BY p.id
      ORDER BY p.category, p.name
    `);
    
    res.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

// Get permissions by category
router.get('/by-category', requireAuth, async (req, res) => {
  try {
    await db.connect();
    
    const permissions = await db.db.all(`
      SELECT p.*, 
        COUNT(tp.tag_id) as tag_count
      FROM permissions p
      LEFT JOIN tag_permissions tp ON p.id = tp.permission_id
      GROUP BY p.id
      ORDER BY p.category, p.name
    `);
    
    // Group by category
    const permissionsByCategory = {};
    permissions.forEach(permission => {
      if (!permissionsByCategory[permission.category]) {
        permissionsByCategory[permission.category] = [];
      }
      permissionsByCategory[permission.category].push(permission);
    });
    
    res.json({ permissionsByCategory });
  } catch (error) {
    console.error('Error fetching permissions by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

// Get tag permissions (which permissions each tag has)
router.get('/tags', requireAuth, async (req, res) => {
  try {
    await db.connect();
    
    // Get all tags with their permissions
    const tagPermissions = await db.db.all(`
      SELECT 
        t.id as tag_id,
        t.name as tag_name,
        t.color as tag_color,
        p.id as permission_id,
        p.name as permission_name,
        p.description as permission_description,
        p.category as permission_category
      FROM tags t
      LEFT JOIN tag_permissions tp ON t.id = tp.tag_id
      LEFT JOIN permissions p ON tp.permission_id = p.id
      ORDER BY t.name, p.category, p.name
    `);
    
    // Group by tag
    const tagPermissionsMap = {};
    tagPermissions.forEach(row => {
      if (!tagPermissionsMap[row.tag_id]) {
        tagPermissionsMap[row.tag_id] = {
          id: row.tag_id,
          name: row.tag_name,
          color: row.tag_color,
          permissions: []
        };
      }
      
      if (row.permission_id) {
        tagPermissionsMap[row.tag_id].permissions.push({
          id: row.permission_id,
          name: row.permission_name,
          description: row.permission_description,
          category: row.permission_category
        });
      }
    });
    
    res.json({ 
      tagPermissions: Object.values(tagPermissionsMap)
    });
  } catch (error) {
    console.error('Error fetching tag permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

// Update tag permissions
router.put('/tags/:tagId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { tagId } = req.params;
    const { permissionIds } = req.body;
    
    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ error: 'permissionIds must be an array' });
    }
    
    await db.connect();
    
    // Verify tag exists
    const tag = await db.db.get('SELECT * FROM tags WHERE id = ?', [tagId]);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    // Remove all existing permissions for this tag
    await db.db.run('DELETE FROM tag_permissions WHERE tag_id = ?', [tagId]);
    
    // Add new permissions
    for (const permissionId of permissionIds) {
      // Verify permission exists
      const permission = await db.db.get('SELECT * FROM permissions WHERE id = ?', [permissionId]);
      if (permission) {
        await db.db.run(
          'INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)',
          [tagId, permissionId]
        );
      }
    }
    
    res.json({ 
      message: 'Tag permissions updated successfully',
      tagId: parseInt(tagId),
      permissionIds 
    });
  } catch (error) {
    console.error('Error updating tag permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

// Create new permission
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    
    await db.connect();
    
    // Check if permission already exists
    const existing = await db.db.get('SELECT * FROM permissions WHERE name = ?', [name]);
    if (existing) {
      return res.status(400).json({ error: 'Permission with this name already exists' });
    }
    
    const result = await db.db.run(
      'INSERT INTO permissions (name, description, category) VALUES (?, ?, ?)',
      [name, description, category || 'general']
    );
    
    const newPermission = await db.db.get('SELECT * FROM permissions WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ 
      message: 'Permission created successfully',
      permission: newPermission 
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

// Update permission
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    
    await db.connect();
    
    // Check if permission exists
    const existing = await db.db.get('SELECT * FROM permissions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    // Check if name is taken by another permission
    const nameCheck = await db.db.get('SELECT * FROM permissions WHERE name = ? AND id != ?', [name, id]);
    if (nameCheck) {
      return res.status(400).json({ error: 'Permission with this name already exists' });
    }
    
    await db.db.run(
      'UPDATE permissions SET name = ?, description = ?, category = ? WHERE id = ?',
      [name, description, category || existing.category, id]
    );
    
    const updatedPermission = await db.db.get('SELECT * FROM permissions WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Permission updated successfully',
      permission: updatedPermission 
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

// Delete permission
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.connect();
    
    // Check if permission exists
    const existing = await db.db.get('SELECT * FROM permissions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    // Delete permission (cascade will remove tag_permissions automatically)
    await db.db.run('DELETE FROM permissions WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Permission deleted successfully',
      deletedPermission: existing 
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await db.close();
  }
});

module.exports = router;
