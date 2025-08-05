# StarDeception Wiki

Un wiki interactif et moderne pour Star Deception, construit avec React, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités

- **Interface moderne** : Design sombre et épuré avec Tailwind CSS
- **Navigation intuitive** : Sidebar avec structure hiérarchique
- **Édition en temps réel** : Modal d'édition pour modifier le contenu
- **Rendu Markdown** : Support complet du Markdown pour le contenu
- **Responsive** : Compatible avec tous les appareils
- **Performance** : Construit avec Vite pour un développement rapide

## 🛠️ Technologies utilisées

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Build Tool** : Vite
- **Icons** : Lucide React
- **Linting** : ESLint

## 📦 Installation

1. Clonez le repository :
```bash
git clone https://github.com/NoaSecond/StarDeception-Wiki.git
cd StarDeception-Wiki
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

## 📁 Structure du projet

```
StarDeception-Wiki/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── EditModal.tsx    # Modal d'édition
│   │   ├── Header.tsx       # En-tête de l'application
│   │   ├── MainContent.tsx  # Contenu principal
│   │   ├── MarkdownRenderer.tsx # Rendu Markdown
│   │   └── Sidebar.tsx      # Barre latérale de navigation
│   ├── context/
│   │   └── WikiContext.tsx  # Contexte global de l'application
│   ├── App.tsx              # Composant principal
│   ├── main.tsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── public/                  # Fichiers statiques
├── index.html              # Template HTML
└── package.json            # Dépendances et scripts
```

## 🎨 Personnalisation

### Thème
L'application utilise un thème sombre par défaut avec Tailwind CSS. Vous pouvez modifier les couleurs dans `tailwind.config.js`.

### Contenu
Le contenu du wiki peut être modifié via l'interface d'édition ou en modifiant directement les composants dans le dossier `src/components/`.

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

**NoaSecond** - [@NoaSecond](https://github.com/NoaSecond)

Lien du projet : [https://github.com/NoaSecond/StarDeception-Wiki](https://github.com/NoaSecond/StarDeception-Wiki)

---

⭐ N'hésitez pas à donner une étoile au projet si vous l'aimez !
