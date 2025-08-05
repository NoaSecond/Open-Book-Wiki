<div align="center">
  <img src="public/Logo.svg" alt="Open Book Wiki Logo" width="500">
  
  # Open Book Wiki

  Un wiki interactif et moderne open source, construit avec React, TypeScript et Tailwind CSS.
</div>

## 🛠️ Technologies utilisées

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Build Tool** : Vite
- **Icons** : Lucide React
- **Linting** : ESLint

## 📦 Installation

1. Clonez le repository :
```bash
git clone https://github.com/NoaSecond/Open-Book-Wiki
cd Open-Book-Wiki
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
```

4. Ouvrez votre navigateur et accédez à `http://localhost:5173`

## 🔧 Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Construit l'application pour la production
- `npm run preview` : Prévisualise la version de production
- `npm run lint` : Vérifie le code avec ESLint

## 🎨 Personnalisation

### Thème
L'application utilise un thème sombre par défaut avec Tailwind CSS. Vous pouvez modifier les couleurs dans `tailwind.config.js`.

### Contenu
Le contenu du wiki peut être modifié via l'interface d'édition ou en modifiant directement les composants dans le dossier `src/components/`.

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements en utilisant **Gitmoji** (`git commit -m '✨ Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### 🎨 Convention Gitmoji

Ce projet utilise [Gitmoji](https://gitmoji.dev/) pour des messages de commit expressifs.
Installez l'extension Gitmoji pour faciliter l'utilisation :
```bash
npm install -g gitmoji-cli
gitmoji -c
```

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.