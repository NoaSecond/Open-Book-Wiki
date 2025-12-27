const DatabaseManager = require('./backend/src/config/database');

async function checkAndAddGuestTag() {
    const db = new DatabaseManager();
    try {
        await db.connect();

        // Check if tag exists
        const guestTag = await db.db.get("SELECT * FROM tags WHERE name = 'Utilisateur non connecté'");
        if (!guestTag) {
            console.log("Adding guest tag...");
            const result = await db.db.run("INSERT INTO tags (name, color) VALUES ('Utilisateur non connecté', '#94A3B8')");
            const tagId = result.lastID;

            // Get permissions
            const allPermissions = await db.db.all("SELECT id, name FROM permissions");
            const permissionMap = {};
            allPermissions.forEach(p => permissionMap[p.name] = p.id);

            const guestPermissions = ['view_activity'];
            for (const permName of guestPermissions) {
                if (permissionMap[permName]) {
                    await db.db.run("INSERT INTO tag_permissions (tag_id, permission_id) VALUES (?, ?)", [tagId, permissionMap[permName]]);
                }
            }
            console.log("Guest tag and permissions added.");
        } else {
            console.log("Guest tag already exists.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await db.close();
    }
}

checkAndAddGuestTag();
