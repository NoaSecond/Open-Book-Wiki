const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data/openbookwiki.db');
const db = new sqlite3.Database(dbPath);

async function checkAndFixAdmin() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Vérification de l\'utilisateur admin...');
    
    // Vérifier l'utilisateur admin actuel
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, user) => {
      if (err) {
        console.error('Erreur:', err);
        return reject(err);
      }
      
      if (user) {
        console.log('👤 Utilisateur admin trouvé:', {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: user.is_admin,
          avatar: user.avatar
        });
        
        if (user.is_admin !== 1) {
          console.log('⚠️ L\'utilisateur admin n\'a pas les droits administrateur, correction...');
          
          // Mettre à jour l'utilisateur
          db.run('UPDATE users SET is_admin = 1 WHERE username = ?', ['admin'], function(err) {
            if (err) {
              console.error('Erreur lors de la mise à jour:', err);
              return reject(err);
            }
            console.log('✅ Droits administrateur accordés à l\'utilisateur admin');
            
            // Vérifier à nouveau
            db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, updatedUser) => {
              if (err) {
                console.error('Erreur:', err);
                return reject(err);
              }
              console.log('🔄 Utilisateur admin mis à jour:', {
                id: updatedUser.id,
                username: updatedUser.username,
                is_admin: updatedUser.is_admin
              });
              db.close();
              resolve();
            });
          });
        } else {
          console.log('✅ L\'utilisateur admin a déjà les droits administrateur');
          db.close();
          resolve();
        }
      } else {
        console.log('❌ Aucun utilisateur admin trouvé');
        
        // Créer l'utilisateur admin
        bcrypt.hash('admin123', 10, (err, hashedPassword) => {
          if (err) {
            console.error('Erreur lors du hashage:', err);
            return reject(err);
          }
          
          db.run(
            'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)',
            ['admin', 'admin@openbookwiki.com', hashedPassword, 1],
            function(err) {
              if (err) {
                console.error('Erreur lors de la création:', err);
                return reject(err);
              }
              console.log('✅ Utilisateur admin créé avec les droits administrateur');
              db.close();
              resolve();
            }
          );
        });
      }
    });
  });
}

checkAndFixAdmin().catch(console.error);
