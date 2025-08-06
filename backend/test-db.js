const DatabaseManager = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function testDatabase() {
  const dbManager = new DatabaseManager();
  
  try {
    await dbManager.connect();
    await dbManager.initializeTables();
    
    console.log('=== Test de la base de données ===');
    
    // Vérifier l'utilisateur admin
    const admin = await dbManager.findUserByUsername('admin');
    if (admin) {
      console.log('✅ Utilisateur admin trouvé:');
      console.log('  - ID:', admin.id);
      console.log('  - Username:', admin.username);
      console.log('  - Email:', admin.email);
      console.log('  - Is Admin:', admin.is_admin);
      console.log('  - Password Hash:', admin.password_hash.substring(0, 20) + '...');
      
      // Test du mot de passe
      const isPasswordValid = await bcrypt.compare('admin123', admin.password_hash);
      console.log('  - Mot de passe "admin123" valide:', isPasswordValid);
    } else {
      console.log('❌ Utilisateur admin non trouvé');
    }
    
    // Lister tous les utilisateurs
    const allUsers = await dbManager.getAllUsers();
    console.log('\n=== Tous les utilisateurs ===');
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Admin: ${user.is_admin}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

testDatabase();
