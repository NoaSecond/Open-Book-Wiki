const BaseRepository = require('./base-repository');

class WikiPageRepository extends BaseRepository {
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
}

module.exports = WikiPageRepository;
