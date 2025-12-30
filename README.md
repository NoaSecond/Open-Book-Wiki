<div align="center">
  <img src="public/Logo.svg" alt="Open Book Wiki Logo" width="500">
  
  # Open Book Wiki

  Un wiki interactif et moderne open source, construit avec React, TypeScript et Tailwind CSS.
</div>

## 🛠️ Technologies utilisées

### Frontend
- **Framework** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Build Tool** : Vite
- **Icons** : Lucide React
- **Linting** : ESLint

### Backend
- **Runtime** : Node.js + Express
- **Base de données** : SQLite
- **Authentification** : JWT + bcrypt
- **Sécurité** : Helmet, CORS, Rate Limiting
- **Documentation** : Swagger / OpenAPI

## Documentation API

L'API du backend est entièrement documentée avec Swagger. Vous pouvez explorer les endpoints, les schémas de données et tester les requêtes directement depuis votre navigateur.

- **Accéder à la documentation Swagger** : [`http://localhost:3001/api-docs/`](http://localhost:3001/api-docs/)

> **Note :** Pour tester les routes protégées, vous pouvez utiliser le bouton "Authorize" dans Swagger et entrer le token JWT obtenu via la route `/auth/login`.

## Démarrage

1. **Clonez le repository :**
```bash
git clone https://github.com/NoaSecond/Open-Book-Wiki
cd Open-Book-Wiki
```

2. **Installez les dépendances :**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

3. **Créez le dossier pour la base de données :**
```bash
mkdir backend/data
```

4. **Démarrez l'application :**

Dans un premier terminal (Backend) :
```bash
cd backend
npm start
```

Dans un second terminal (Frontend) :
```bash
npm run dev
```

5. **Accédez à l'application :**
- Frontend : `http://localhost:5176`
- API Backend : `http://localhost:3001`

### Connexion par défaut

- **Nom d'utilisateur :** `admin`
- **Mot de passe :** `admin123`

## Configuration (Optionnel)

Vous pouvez configurer les ports et l'URL de l'API en modifiant les fichiers `.env` à la racine et dans le dossier `backend`.

1. **Frontend** : Modifiez le fichier `.env` à la racine du projet.
   - `VITE_PORT` : Port du serveur frontend (défaut : 5176)
   - `VITE_API_URL` : URL de l'API backend (défaut : http://localhost:3001)

2. **Backend** : Modifiez le fichier `backend/.env`.
   - `PORT` : Port du serveur backend (défaut : 3001)
   - `FRONTEND_URL` : URL du frontend pour CORS (défaut : http://localhost:5176)

## Scripts disponibles

### Frontend
- `npm run dev` : Lance le serveur de développement frontend
- `npm run build` : Construit l'application pour la production
- `npm run preview` : Prévisualise la version de production
- `npm run lint` : Vérifie le code avec ESLint
- `npm run backend` : Lance uniquement le backend
- `npm run start` : Alias pour `npm run dev`

### Backend
- `npm start` : Lance le serveur backend (depuis le dossier backend/)

### Contenu
Le contenu du wiki peut être modifié via l'interface d'édition ou en modifiant directement les composants dans le dossier `src/components/`.

## Contribution

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements en utilisant **Gitmoji** (`git commit -m '✨ Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Convention Gitmoji

Ce projet utilise [Gitmoji](https://gitmoji.dev/) pour des messages de commit expressifs.
Installez l'extension Gitmoji pour faciliter l'utilisation :
```bash
npm install -g gitmoji-cli
gitmoji -c
```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.