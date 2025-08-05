# Avatars par défaut

Ce dossier contient les avatars prédéfinis disponibles pour les utilisateurs du wiki Star Deception.

## 📁 Contenu

### Avatars colorés
- `avatar-blue.svg` - Avatar bleu
- `avatar-green.svg` - Avatar vert  
- `avatar-orange.svg` - Avatar orange
- `avatar-purple.svg` - Avatar violet
- `avatar-red.svg` - Avatar rouge
- `avatar-cyan.svg` - Avatar cyan

### Avatar spécial
- `avatar-star-deception.svg` - Avatar thématique Star Deception avec étoile

## 🎨 Format

Tous les avatars sont au format SVG pour :
- **Qualité parfaite** à toutes les tailles
- **Poids léger** pour des performances optimales
- **Compatibilité** avec tous les navigateurs modernes
- **Thème cohérent** avec l'interface du wiki

## 🔧 Ajout d'avatars

Pour ajouter de nouveaux avatars :

1. Créez un fichier SVG de 100x100px
2. Placez-le dans ce dossier
3. Ajoutez le chemin dans `AvatarEditor.tsx` :
   ```typescript
   const predefinedAvatars = [
     // ... avatars existants
     '/avatars/votre-nouvel-avatar.svg',
   ];
   ```

## 🎯 Recommandations

- **Taille** : 100x100px minimum
- **Format** : SVG recommandé, PNG/JPG acceptés
- **Style** : Cohérent avec le thème sombre du wiki
- **Couleurs** : Utiliser des couleurs vives qui ressortent sur fond sombre
