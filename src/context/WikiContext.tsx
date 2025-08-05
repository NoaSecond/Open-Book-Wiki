import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User as AuthUser } from '../services/authService';
import activityService from '../services/activityService';
import logger from '../utils/logger';

interface ReadmeSection {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  author: string;
}

interface WikiData {
  [key: string]: {
    title: string;
    content?: string; // Pour les pages simples
    sections?: ReadmeSection[]; // Pour les pages avec sections multiples
    lastModified: string;
    author: string;
  };
}

// Utilisation de l'interface User du service d'authentification
interface User extends AuthUser {
  email?: string;
  avatar?: string;
  bio?: string;
  joinDate?: string;
  contributions?: number;
}

interface WikiContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  wikiData: WikiData;
  updatePage: (pageId: string, content: string) => void;
  addSection: (pageId: string, sectionTitle: string) => string; // Retourne l'ID de la nouvelle section
  addPage: (pageTitle: string) => string; // Ajouter une nouvelle page/catégorie
  renamePage: (oldPageId: string, newTitle: string) => string; // Renommer une page
  deletePage: (pageId: string) => boolean; // Supprimer une page
  renameSection: (pageId: string, sectionId: string, newTitle: string) => boolean; // Renommer une section
  deleteSection: (pageId: string, sectionId: string) => boolean; // Supprimer une section
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editingPage: string;
  setEditingPage: (page: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // États d'authentification
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  // Panel d'administration
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (open: boolean) => void;
  openAdminPanel: () => void;
  // Gestion des utilisateurs et permissions
  allUsers: User[];
  setAllUsers: (users: User[]) => void;
  updateUserTags: (username: string, tags: string[]) => Promise<void>;
  updateUserProfile: (userId: number, updates: Partial<User & { password?: string }>) => Promise<boolean>;
  deleteUserProfile: (userId: number) => Promise<boolean>;
  hasPermission: (requiredTag: string) => boolean;
  canContribute: () => boolean;
  isAdmin: () => boolean;
  // Thème
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

const initialWikiData: WikiData = {
  home: {
    title: "Accueil - Star Deception Wiki",
    sections: [
      {
        id: "welcome",
        title: "Bienvenue sur le Wiki Star Deception",
        content: `# Bienvenue sur le Wiki Star Deception

Star Deception est un jeu vidéo de science-fiction captivant qui vous plonge dans un univers où la tromperie et la stratégie sont essentielles à la survie.`,
        lastModified: "2025-01-27",
        author: "Admin"
      },
      {
        id: "about-game",
        title: "À propos du jeu",
        content: `# À propos du jeu

Dans Star Deception, les joueurs naviguent dans un cosmos hostile où chaque décision peut changer le cours de l'histoire. Explorez des galaxies lointaines, rencontrez des civilisations alien, et découvrez les secrets cachés de l'univers.`,
        lastModified: "2025-01-27",
        author: "Admin"
      },
      {
        id: "main-features",
        title: "Caractéristiques principales",
        content: `# Caractéristiques principales

- **Gameplay stratégique** : Chaque décision compte
- **Univers riche** : Des dizaines de planètes à explorer
- **Personnages complexes** : Des alliés et ennemis mémorables
- **Histoire immersive** : Une narration profonde et engageante

Explorez les différentes sections de ce wiki pour découvrir tous les secrets de Star Deception !`,
        lastModified: "2025-01-27",
        author: "Admin"
      }
    ],
    lastModified: "2025-01-27",
    author: "Admin"
  },
  characters: {
    title: "Personnages",
    sections: [
      {
        id: "main-characters",
        title: "Personnages Principaux",
        content: `# Personnages Principaux

### Captain Nova Sterling
Le protagoniste principal, un commandant expérimenté de la Flotte Stellaire. Nova est connu pour sa capacité à prendre des décisions difficiles sous pression.

**Caractéristiques :**
- Âge : 34 ans
- Origine : Terre
- Spécialité : Tactique spatiale
- Arme favorite : Blaster plasma MK-VII

### Dr. Lydia Chen
Scientifique brillante spécialisée dans la xéno-biologie. Elle accompagne Nova dans ses missions d'exploration.

**Caractéristiques :**
- Âge : 29 ans
- Origine : Station Mars Alpha
- Spécialité : Recherche scientifique
- Équipement : Scanner quantique

### Commandant Zephyr
Ancien allié devenu rival, Zephyr représente l'une des principales menaces du jeu.

**Caractéristiques :**
- Âge : 42 ans
- Origine : Inconnue
- Spécialité : Combat rapproché
- Statut : Antagoniste principal`,
        lastModified: "2025-01-27",
        author: "GameMaster"
      },
      {
        id: "secondary-characters",
        title: "Personnages Secondaires",
        content: `# Personnages Secondaires

Les PNJ jouent un rôle crucial dans l'expérience de jeu, offrant des quêtes, des informations et des défis uniques.`,
        lastModified: "2025-01-27",
        author: "GameMaster"
      }
    ],
    lastModified: "2025-01-27",
    author: "GameMaster"
  },
  gameplay: {
    title: "Gameplay",
    sections: [
      {
        id: "combat-system",
        title: "Système de Combat",
        content: `# Système de Combat

Le combat dans Star Deception combine stratégie et action en temps réel.

## Combat Spatial
Pilotez votre vaisseau dans des batailles épiques contre d'autres joueurs ou des flottes aliens.

### Mécaniques clés :
- **Manœuvres évasives** : Esquivez les tirs ennemis avec des mouvements précis
- **Systèmes d'armement** : Lasers, missiles, torpilles à plasma
- **Boucliers énergétiques** : Gérez votre énergie entre attaque et défense
- **Ciblage tactique** : Visez les points faibles des vaisseaux ennemis

## Combat au Sol
Affrontements tactiques sur les planètes avec votre équipage.

### Caractéristiques :
- **Système de couverture** : Utilisez l'environnement à votre avantage
- **Équipes tactiques** : Coordonnez vos compagnons d'équipe
- **Armes variées** : Du pistolet laser au canon à plasma lourd
- **Environnements destructibles** : Créez vos propres couverts`,
        lastModified: "2025-08-05",
        author: "CombatExpert"
      },
      {
        id: "exploration",
        title: "Exploration et Découverte",
        content: `# Exploration et Découverte

L'exploration est au cœur de l'expérience Star Deception.

## Planètes Procédurales
Chaque monde est généré de manière unique avec ses propres biomes et secrets.

### Types de planètes :
- **Mondes désertiques** : Vastes étendues sablonneuses avec oasis cachées
- **Planètes océaniques** : Archipels flottants et cités sous-marines
- **Stations spatiales abandonnées** : Mystères technologiques à découvrir
- **Zones interdites** : Régions dangereuses avec récompenses exceptionnelles

## Ressources et Collecte
- **Minerais rares** : Nécessaires pour améliorer votre équipement
- **Technologies alien** : Artefacts mystérieux aux pouvoirs inconnus
- **Données historiques** : Reconstituez l'histoire de civilisations perdues
- **Crédits galactiques** : La monnaie universelle pour le commerce

## Découvertes Cachées
- **Temples anciens** : Structures mystérieuses laissées par des civilisations disparues
- **Portails dimensionnels** : Raccourcis vers des systèmes éloignés
- **Épaves de vaisseaux** : Vestiges de batailles passées contenant des trésors`,
        lastModified: "2025-08-05",
        author: "ExplorerPro"
      },
      {
        id: "progression",
        title: "Progression du Personnage",
        content: `# Progression du Personnage

Développez votre personnage et votre équipement au fil de vos aventures.

## Système de Niveaux
Gagnez de l'expérience en explorant, combattant et accomplissant des missions.

### Sources d'expérience :
- **Exploration** : Découverte de nouveaux lieux (+50-200 XP)
- **Combat** : Victoires contre ennemis (+25-100 XP par ennemi)
- **Missions** : Complétion d'objectifs (+100-500 XP)
- **Découvertes** : Artefacts et secrets (+75-300 XP)

## Arbres de Compétences
Trois branches principales à développer :

### 🚀 Pilotage
- **Manœuvres avancées** : Mouvements évasifs améliorés
- **Efficacité énergétique** : Consommation réduite des systèmes
- **Ciblage de précision** : Amélioration de la précision des tirs

### 🔬 Science
- **Analyse alien** : Déchiffrage plus rapide des technologies
- **Réparations d'urgence** : Soins rapides en combat
- **Recherche avancée** : Découverte de nouveaux équipements

### ⚔️ Combat
- **Expertise martiale** : Dégâts au corps à corps augmentés
- **Tactiques d'équipe** : Bonus pour les compagnons
- **Résistance** : Points de vie et armure améliorés`,
        lastModified: "2025-08-05",
        author: "GameMaster"
      },
      {
        id: "multiplayer",
        title: "Modes Multijoueur",
        content: `# Modes Multijoueur

Star Deception offre plusieurs façons de jouer avec d'autres joueurs.

## Coopération
Explorez l'univers avec vos amis dans des missions coopératives.

### Fonctionnalités coop :
- **Équipages partagés** : Jusqu'à 4 joueurs par vaisseau
- **Missions d'équipe** : Objectifs nécessitant la coopération
- **Partage de ressources** : Économie commune pour l'équipe
- **Communication intégrée** : Chat vocal et textuel

## PvP (Joueur contre Joueur)
Affrontez d'autres capitaines dans des batailles intenses.

### Modes PvP :
- **Duels spatiaux** : Combats 1v1 dans l'espace
- **Batailles de flotte** : Affrontements massifs jusqu'à 20v20
- **Contrôle de territoire** : Capturez et défendez des systèmes stellaires
- **Tournois** : Compétitions organisées avec récompenses

## Guildes et Alliances
Rejoignez ou créez des organisations de joueurs.

### Avantages des guildes :
- **Base partagée** : Station spatiale commune
- **Missions de guilde** : Objectifs à long terme
- **Commerce interne** : Marché privé entre membres
- **Classements** : Compétition entre guildes`,
        lastModified: "2025-08-05",
        author: "MultiplayerDev"
      }
    ],
    lastModified: "2025-08-05",
    author: "GameDesignTeam"
  },
  story: {
    title: "Histoire",
    sections: [
      {
        id: "context",
        title: "Contexte",
        content: `# Contexte

L'année 2387, l'humanité a colonisé plus de 200 systèmes stellaires. Mais une découverte bouleversante va changer le cours de l'histoire...`,
        lastModified: "2025-01-27",
        author: "StoryWriter"
      },
      {
        id: "act-1",
        title: "Acte I : La Découverte",
        content: `# Acte I : La Découverte

Tout commence lorsque Captain Nova Sterling découvre un signal mystérieux provenant des confins de la galaxie. Ce signal semble contenir des informations sur une civilisation ancienne disparue depuis des millénaires.

### Chapitres principaux :
1. **Premier Contact** - La découverte du signal
2. **L'Expédition** - Formation de l'équipe d'exploration
3. **Secrets Cachés** - Premières révélations troublantes`,
        lastModified: "2025-01-27",
        author: "StoryWriter"
      },
      {
        id: "act-2",
        title: "Acte II : La Révélation",
        content: `# Acte II : La Révélation

L'équipe découvre que cette civilisation ancienne avait développé une technologie capable de manipuler la réalité elle-même. Mais cette découverte attire l'attention d'ennemis redoutables.

### Chapitres principaux :
4. **La Technologie Perdue** - Découverte des artefacts
5. **Trahison** - Un allié révèle sa vraie nature
6. **La Fuite** - Échapper aux forces ennemies`,
        lastModified: "2025-01-27",
        author: "StoryWriter"
      },
      {
        id: "act-3",
        title: "Acte III : La Confrontation finale",
        content: `# Acte III : La Confrontation finale

Nova et son équipe doivent empêcher que cette technologie tombe entre de mauvaises mains, même si cela signifie affronter leurs propres démons.

### Chapitres principaux :
7. **Préparatifs** - Rassembler les alliés
8. **La Bataille finale** - Confrontation épique
9. **Épilogue** - Les conséquences des choix du joueur`,
        lastModified: "2025-01-27",
        author: "StoryWriter"
      }
    ],
    lastModified: "2025-01-27",
    author: "StoryWriter"
  },
  items: {
    title: "Objets et Équipements",
    sections: [
      {
        id: "weapons",
        title: "Armes et Armements",
        content: `# Armes et Armements

## Armes Primaires

### Blaster Plasma MK-VII
L'arme standard de la Flotte Stellaire, fiable et efficace.

**Caractéristiques :**
- **Dégâts :** 45-60 points
- **Portée :** Moyenne (150m)
- **Cadence :** Rapide (3 tirs/seconde)
- **Énergie :** 15% par tir
- **Spécial :** Mode surcharge (+50% dégâts, consomme 40% énergie)

### Fusil à Ions Quantique
Arme de précision utilisant la technologie quantique avancée.

**Caractéristiques :**
- **Dégâts :** 80-120 points
- **Portée :** Longue (300m)
- **Cadence :** Lente (1 tir/2 secondes)
- **Énergie :** 35% par tir
- **Spécial :** Ignore les boucliers énergétiques

## Armes Secondaires

### Grenades Plasma
Explosifs à énergie plasma pour contrôle de zone.

**Effets :**
- **Dégâts initiaux :** 75-100 points
- **Zone d'effet :** Rayon de 5 mètres
- **Effet brûlure :** 10 points/seconde pendant 5 secondes
- **Quantité max :** 6 grenades

### Mines Électromagnétiques
Pièges défensifs pour sécuriser une zone.

**Propriétés :**
- **Activation :** Détection de mouvement
- **Dégâts :** 150 points + paralysie 3 secondes
- **Portée détection :** 8 mètres
- **Durée de vie :** 5 minutes`,
        lastModified: "2025-08-05",
        author: "WeaponExpert"
      },
      {
        id: "equipment",
        title: "Équipements Défensifs",
        content: `# Équipements Défensifs

## Boucliers Énergétiques

### Bouclier Personnel Standard
Le bouclier de base fourni à tous les explorateurs.

**Spécifications :**
- **Protection :** 100 points de bouclier
- **Régénération :** 5 points/seconde (après 3 sec sans dégât)
- **Résistance :** +25% contre dégâts énergétiques
- **Poids :** 2.5 kg
- **Autonomie :** 4 heures d'utilisation continue

### Bouclier Adaptatif Alien
Technologie alien récupérée et reverse-engineered.

**Capacités avancées :**
- **Protection :** 150 points de bouclier
- **Régénération :** 8 points/seconde (après 2 sec sans dégât)
- **Adaptation :** +15% résistance au type de dégât le plus reçu
- **Absorption :** Convertit 10% des dégâts reçus en énergie
- **Rareté :** Très rare, trouvé dans les ruines aliens

## Armures

### Exo-Combinaison Spatiale
Protection standard contre les environnements hostiles.

**Protection :**
- **Armure physique :** 25 points
- **Survie spatiale :** 2 heures d'oxygène
- **Régulation thermique :** -50°C à +80°C
- **Radiation :** Protection contre radiations faibles

### Armure de Combat Lourde
Équipement militaire pour les missions dangereuses.

**Avantages :**
- **Armure physique :** 75 points
- **Réduction dégâts :** -20% tous dégâts physiques
- **Système d'arme intégré :** Lance-grenades d'épaule
- **Inconvénient :** -30% vitesse de déplacement`,
        lastModified: "2025-08-05",
        author: "DefenseSpecialist"
      }
    ],
    lastModified: "2025-08-05",
    author: "EquipmentTeam"
  },
  locations: {
    title: "Lieux",
    sections: [
      {
        id: "stellar-systems",
        title: "Systèmes Stellaires",
        content: `# Systèmes Stellaires

### Système Sol (Système de départ)

**Terre**
- Population : 12 milliards
- Gouvernement : Fédération Terrienne
- Particularités : Planète d'origine de l'humanité
- Lieux d'intérêt : Académie Spatiale, Centre de Commandement

**Mars**
- Population : 800 millions
- Gouvernement : Colonie autonome
- Particularités : Centre industriel majeur
- Lieux d'intérêt : Usines de vaisseaux, Mines de fer

### Système Alpha Centauri

**Proxima Centauri b**
- Population : 50 millions
- Environnement : Planète désertique avec oasis
- Particularités : Première colonie extra-solaire
- Dangers : Tempêtes de sable, créatures hostiles

### Système Kepler-442

**Kepler-442b (Nouvelle Eden)**
- Population : 200 millions
- Environnement : Planète jungle luxuriante
- Particularités : Biodiversité exceptionnelle
- Lieux secrets : Temples aliens cachés`,
        lastModified: "2025-01-27",
        author: "Explorer"
      },
      {
        id: "space-stations",
        title: "Stations Spatiales",
        content: `# Stations Spatiales

### Station Nexus Alpha
- Type : Station commerciale
- Population : 2 millions
- Fonction : Centre de commerce intergalactique
- Services : Marché, Réparations, Informations

### Avant-poste Omega
- Type : Base militaire
- Population : 50 000
- Fonction : Surveillance des frontières
- Particularités : Technologie de pointe`,
        lastModified: "2025-01-27",
        author: "Explorer"
      },
      {
        id: "mysterious-places",
        title: "Lieux Mystérieux",
        content: `# Lieux Mystérieux

### La Nébuleuse Émeraude
- Type : Phénomène spatial
- Dangers : Radiations, Anomalies temporelles
- Secrets : Ruines d'une civilisation ancienne

### Le Vide Silencieux
- Type : Région d'espace vide
- Particularités : Communications impossibles
- Mystère : Disparitions inexpliquées de vaisseaux`,
        lastModified: "2025-01-27",
        author: "Explorer"
      }
    ],
    lastModified: "2025-01-27",
    author: "Explorer"
  },
  development: {
    title: "Développement Open Source",
    sections: [
      {
        id: "github-organization",
        title: "Organisation GitHub StarDeception",
        content: `# 🌌 Développement de Star Deception

## Organisation GitHub StarDeception

Star Deception est un projet de jeu **100% open source** développé de manière collaborative et transparente. Toute l'organisation du développement est accessible publiquement sur GitHub.

🔗 **[Organisation StarDeception sur GitHub](https://github.com/orgs/StarDeception/)**`,
        lastModified: "2025-08-05",
        author: "DevTeam"
      },
      {
        id: "project-vision",
        title: "🎯 Vision du Projet",
        content: `# 🎯 Vision du Projet

Star Deception est un **MMO spatial immersif et communautaire** qui vise à offrir une alternative indépendante aux grands titres du genre. Le projet est construit **par et pour les passionnés**, avec une philosophie d'ouverture totale.

### Principes Fondamentaux
- 🎮 **Un vrai jeu complet**, pas seulement un bac à sable technique
- 🌍 **MMO modulaire** centré sur la simulation, la narration, la coopération et l'exploration
- 🛠️ **100% open source** — transparent, forkable, participatif
- 🤝 **Développement communautaire**, inclusif et organique
- 🪐 **Univers vivant**, construit avec les idées de chacun
- 🎯 **Propulsé par Godot Engine** — open source, flexible et communautaire`,
        lastModified: "2025-08-05",
        author: "DevTeam"
      },
      {
        id: "repositories",
        title: "📂 Repositories Principaux",
        content: `# 📂 Repositories Principaux

### [StarDeception/StarDeception](https://github.com/StarDeception/StarDeception)
🏷️ **Repository principal du jeu**
- **Langage :** GDScript (Godot Engine)
- **Stars :** ⭐ 19
- **Licence :** MIT
- **Statut :** Activement développé
- **Description :** Code source principal du jeu Star Deception

### [StarDeception/SDO](https://github.com/StarDeception/SDO)
🏷️ **StarDeception Orchestrator**
- **Fonction :** Orchestrateur du projet
- **Stars :** ⭐ 1
- **Statut :** En développement
- **Description :** Système de coordination et d'orchestration pour le développement

### [StarDeception/Lore](https://github.com/StarDeception/Lore)
🏷️ **Univers et Histoire**
- **Langage :** Makefile
- **Licence :** CC0-1.0 (Domaine public)
- **Stars :** ⭐ 1
- **Description :** Toute la lore et l'univers narratif de Star Deception

### [StarDeception/Plan](https://github.com/StarDeception/Plan)
🏷️ **Roadmap et Planification**
- **Stars :** ⭐ 6
- **Description :** Le plan de développement complet du jeu
- **Contenu :** Objectifs, milestones, vision à long terme

### [StarDeception/.github](https://github.com/StarDeception/.github)
🏷️ **Configuration de l'organisation**
- **Description :** Profil et configuration de l'organisation GitHub`,
        lastModified: "2025-08-05",
        author: "DevTeam"
      },
      {
        id: "game-features",
        title: "🎮 Éléments Clés du Jeu",
        content: `# 🎮 Éléments Clés du Jeu

### Gameplay Varié
- ⛏️ **Minage** et extraction de ressources
- 🌍 **Exploration** de systèmes stellaires
- 🚛 **Transport** et commerce galactique
- 🏔️ **Survie** dans des environnements hostiles
- ⚔️ **Factions** et diplomatie interstellaire

### Univers Immersif
- 🌍 **Planètes uniques** : déserts, océans, zones interdites, archipels flottants
- 🎭 **Création de personnage** via une interface narrative jouable
- 🛰️ **Univers persistant** avec une lore évolutive et des intrigues cachées
- 📦 **Contenu modulaire** : chaque système peut évoluer ou être ajouté librement

## 🔭 Vision à Long Terme

L'équipe de développement vise :

- 🔹 **Dizaines de systèmes stellaires** explorables
- 🔹 **Multiples profils de joueurs** (civils, techniciens, dissidents...)
- 🔹 **Milliers de joueurs connectés** simultanément
- 🔹 **Un jeu qui évolue constamment** avec sa communauté ❤️`,
        lastModified: "2025-08-05",
        author: "DevTeam"
      },
      {
        id: "join-project",
        title: "🧑‍🚀 Rejoindre le Projet",
        content: `# 🧑‍🚀 Rejoindre le Projet

**Vous êtes :**
- 💻 Développeur
- 🎨 Game designer
- 🖼️ Illustrateur
- 🎯 Artiste 3D
- 🎬 Animateur
- ✍️ Écrivain
- 🎵 Sound designer
- 🎼 Musicien
- 🤔 Ou simplement curieux

**👉 Vous êtes les bienvenus !**

Star Deception est une aventure ouverte. **Forkez. Contribuez. Rêvons grand. Ensemble.**

## 📚 Liens Utiles

- 🌐 [Site Web](https://stardeception.com/) *(bientôt disponible)*
- 💬 [Discord Communautaire](https://discord.gg/YKKTZtuN)
- 📂 [Tous les repositories](https://github.com/orgs/StarDeception/repositories)
- 📖 Documentation technique *(bientôt disponible)*
- 🗺️ Roadmap détaillée *(bientôt disponible)*

## 🤝 Comment Contribuer

### 1. Choisissez votre domaine
Consultez les repositories selon vos compétences :
- **Code :** [StarDeception/StarDeception](https://github.com/StarDeception/StarDeception)
- **Lore :** [StarDeception/Lore](https://github.com/StarDeception/Lore)
- **Planification :** [StarDeception/Plan](https://github.com/StarDeception/Plan)

### 2. Rejoignez la communauté
- Rejoignez le [Discord](https://discord.gg/YKKTZtuN) pour discuter
- Consultez les issues ouvertes sur GitHub
- Participez aux discussions de design

### 3. Contribuez
- Forkez le repository qui vous intéresse
- Créez votre branche feature
- Soumettez une Pull Request

---

> **Star Deception** — *Un opéra spatial libre, construit ensemble, parmi les étoiles.*`,
        lastModified: "2025-08-05",
        author: "DevTeam"
      }
    ],
    lastModified: "2025-08-05",
    author: "DevCommunity"
  }
};

export const WikiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [wikiData, setWikiData] = useState<WikiData>(initialWikiData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États d'authentification
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Panel d'administration
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // État des utilisateurs et permissions - maintenant synchronisé avec authService
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Initialisation et synchronisation avec authService
  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const fullUser: User = {
        ...currentUser,
        email: currentUser.email || `${currentUser.username}@stardeception.com`,
        avatar: currentUser.avatar, // Préserver l'avatar existant
        bio: getDefaultBio(currentUser.tags),
        joinDate: '2023-01-01',
        contributions: getDefaultContributions(currentUser.tags)
      };
      setUser(fullUser);
      setIsLoggedIn(true);
    }

    // Charger tous les utilisateurs
    loadAllUsers();
  }, []);

  const getDefaultBio = (tags: string[]): string => {
    if (tags.includes('Administrateur')) return 'Administrateur principal du wiki';
    if (tags.includes('Contributeur')) return 'Contributeur actif';
    return 'Nouveau membre';
  };

  const getDefaultContributions = (tags: string[]): number => {
    if (tags.includes('Administrateur')) return 150;
    if (tags.includes('Contributeur')) return 45;
    return 5;
  };

  const loadAllUsers = () => {
    const authUsers = authService.getAllUsers();
    const fullUsers: User[] = authUsers.map(authUser => ({
      ...authUser,
      email: `${authUser.username}@stardeception.com`,
      bio: getDefaultBio(authUser.tags),
      joinDate: '2023-01-01',
      contributions: getDefaultContributions(authUser.tags)
    }));
    setAllUsers(fullUsers);
  };
  
  // État du thème
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      // Mettre à jour via authService pour persister les changements
      const success = await authService.updateUser(user.id, updates);
      if (success) {
        setUser(prev => ({ ...prev!, ...updates }));
        // Recharger les utilisateurs pour mettre à jour la liste globale
        loadAllUsers();
      }
    }
  };

  // Fonctions de gestion des permissions
  const updateUserTags = async (username: string, tags: string[]) => {
    // Trouver l'utilisateur par username et obtenir son ID
    const targetUser = allUsers.find(u => u.username === username);
    if (targetUser) {
      // Mettre à jour dans authService
      const success = await authService.updateUserTags(targetUser.id, tags);
      if (success) {
        // Recharger les utilisateurs depuis authService
        loadAllUsers();
        
        // Si c'est l'utilisateur connecté, mettre à jour sa session
        if (user && user.username === username) {
          setUser(prev => prev ? { ...prev, tags } : null);
        }
      }
    }
  };

  const updateUserProfile = async (userId: number, updates: Partial<User & { password?: string }>): Promise<boolean> => {
    const success = await authService.updateUser(userId, updates);
    if (success) {
      // Recharger les utilisateurs depuis authService
      loadAllUsers();
      
      // Si c'est l'utilisateur connecté, mettre à jour sa session
      if (user && user.id === userId) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
    }
    return success;
  };

  const deleteUserProfile = async (userId: number): Promise<boolean> => {
    const success = await authService.deleteUser(userId);
    if (success) {
      // Recharger les utilisateurs depuis authService
      loadAllUsers();
      
      // Si c'est l'utilisateur connecté qui est supprimé, le déconnecter
      if (user && user.id === userId) {
        authService.logout();
        setUser(null);
        setIsLoggedIn(false);
      }
    }
    return success;
  };

  const hasPermission = (requiredTag: string): boolean => {
    if (!isLoggedIn || !user) return false;
    return user.tags.includes(requiredTag) || user.tags.includes('Administrateur');
  };

  const canContribute = (): boolean => {
    return hasPermission('Contributeur');
  };

  const isAdmin = (): boolean => {
    return hasPermission('Administrateur');
  };

  // Fonction pour ouvrir le panel d'administration
  const openAdminPanel = () => {
    if (isAdmin()) {
      setIsAdminPanelOpen(true);
    }
  };

  const updatePage = (pageId: string, content: string) => {
    // Si pageId contient ":", c'est une section (format: "pageId:sectionId")
    if (pageId.includes(':')) {
      const [mainPageId, sectionId] = pageId.split(':');
      setWikiData(prev => {
        const currentPage = prev[mainPageId];
        if (currentPage?.sections) {
          const sectionToUpdate = currentPage.sections.find(s => s.id === sectionId);
          const updatedSections = currentPage.sections.map(section =>
            section.id === sectionId
              ? {
                  ...section,
                  content,
                  lastModified: new Date().toISOString().split('T')[0],
                  author: user?.username || "Contributeur"
                }
              : section
          );
          
          // Logger l'activité d'édition de section
          if (user && sectionToUpdate) {
            logger.info('✏️ Section modifiée', `"${sectionToUpdate.title}" dans "${currentPage.title}" par ${user.username}`);
            activityService.addLog({
              userId: user.id,
              username: user.username,
              action: 'edit_section',
              target: currentPage.title,
              details: `Modification de la section "${sectionToUpdate.title}"`
            });
          }
          
          return {
            ...prev,
            [mainPageId]: {
              ...currentPage,
              sections: updatedSections,
              lastModified: new Date().toISOString().split('T')[0],
            }
          };
        }
        return prev;
      });
    } else {
      // Mise à jour normale pour les pages simples (cas rare maintenant)
      setWikiData(prev => {
        const currentPage = prev[pageId];
        
        // Logger l'activité d'édition de page
        if (user && currentPage) {
          activityService.addLog({
            userId: user.id,
            username: user.username,
            action: 'edit_page',
            target: currentPage.title,
            details: `Modification de la page "${currentPage.title}"`
          });
        }
        
        return {
          ...prev,
          [pageId]: {
            ...prev[pageId],
            content,
            lastModified: new Date().toISOString().split('T')[0],
            author: user?.username || "Contributeur"
          }
        };
      });
    }
    
    // Incrémenter le compteur de contributions
    if (user) {
      updateUser({ contributions: (user.contributions || 0) + 1 });
    }
  };

  const addSection = (pageId: string, sectionTitle: string): string => {
    const newSectionId = `section-${Date.now()}`;
    const newSection: ReadmeSection = {
      id: newSectionId,
      title: sectionTitle,
      content: `# ${sectionTitle}\n\nContenu de la nouvelle section...`,
      lastModified: new Date().toISOString().split('T')[0],
      author: user?.username || "Contributeur"
    };

    setWikiData(prev => {
      const currentPage = prev[pageId];
      if (currentPage) {
        // Si la page n'a pas encore de sections, en créer un tableau
        const sections = currentPage.sections || [];
        
        // Logger l'activité de création de section
        if (user) {
          activityService.addLog({
            userId: user.id,
            username: user.username,
            action: 'create_section',
            target: currentPage.title,
            details: `Création de la section "${sectionTitle}"`
          });
        }
        
        return {
          ...prev,
          [pageId]: {
            ...currentPage,
            sections: [...sections, newSection],
            lastModified: new Date().toISOString().split('T')[0],
          }
        };
      }
      return prev;
    });

    // Incrémenter le compteur de contributions
    if (user) {
      updateUser({ contributions: (user.contributions || 0) + 1 });
    }

    return newSectionId;
  };

  const addPage = (pageTitle: string): string => {
    // Créer un ID unique basé sur le titre
    const pageId = pageTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier si la page existe déjà
    if (wikiData[pageId]) {
      logger.warn('⚠️ Page déjà existante', pageTitle);
      console.warn(`La page "${pageTitle}" existe déjà`);
      return pageId;
    }

    const newPage = {
      title: pageTitle,
      sections: [], // Commencer avec une page vide avec sections
      lastModified: new Date().toISOString().split('T')[0],
      author: user?.username || "Contributeur"
    };

    setWikiData(prev => ({
      ...prev,
      [pageId]: newPage
    }));

    // Incrémenter le compteur de contributions
    if (user) {
      updateUser({ contributions: (user.contributions || 0) + 1 });
      logger.success('📄 Nouvelle page créée', `"${pageTitle}" par ${user.username}`);
    }

    return pageId;
  };

  const renamePage = (oldPageId: string, newTitle: string): string => {
    // Créer un nouvel ID basé sur le nouveau titre
    const newPageId = newTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier si la page existe
    if (!wikiData[oldPageId]) {
      console.warn(`La page "${oldPageId}" n'existe pas`);
      return oldPageId;
    }

    // Vérifier si le nouvel ID est différent et n'existe pas déjà
    if (newPageId !== oldPageId && wikiData[newPageId]) {
      console.warn(`Une page avec l'ID "${newPageId}" existe déjà`);
      return oldPageId;
    }

    setWikiData(prev => {
      const updatedData = { ...prev };
      
      // Si l'ID change, créer une nouvelle entrée et supprimer l'ancienne
      if (newPageId !== oldPageId) {
        updatedData[newPageId] = {
          ...updatedData[oldPageId],
          title: newTitle,
          lastModified: new Date().toISOString().split('T')[0],
        };
        delete updatedData[oldPageId];
      } else {
        // Si seul le titre change
        updatedData[oldPageId] = {
          ...updatedData[oldPageId],
          title: newTitle,
          lastModified: new Date().toISOString().split('T')[0],
        };
      }
      
      return updatedData;
    });

    // Si l'ID a changé et que c'est la page actuelle, naviguer vers le nouvel ID
    if (newPageId !== oldPageId && currentPage === oldPageId) {
      setCurrentPage(newPageId);
    }

    return newPageId;
  };

  const deletePage = (pageId: string): boolean => {
    // Vérifier si la page existe
    if (!wikiData[pageId]) {
      console.warn(`La page "${pageId}" n'existe pas`);
      return false;
    }

    // Empêcher la suppression des pages essentielles
    const protectedPages = ['home', 'characters', 'gameplay', 'story', 'items', 'locations', 'development'];
    if (protectedPages.includes(pageId)) {
      console.warn(`La page "${pageId}" est protégée et ne peut pas être supprimée`);
      return false;
    }

    setWikiData(prev => {
      const updatedData = { ...prev };
      delete updatedData[pageId];
      return updatedData;
    });

    // Si c'est la page actuelle qui est supprimée, naviguer vers l'accueil
    if (currentPage === pageId) {
      setCurrentPage('home');
    }

    return true;
  };

  const renameSection = (pageId: string, sectionId: string, newTitle: string): boolean => {
    if (!wikiData[pageId]?.sections) {
      console.warn(`La page "${pageId}" n'a pas de sections`);
      return false;
    }

    setWikiData(prev => {
      const currentPage = prev[pageId];
      if (currentPage?.sections) {
        const updatedSections = currentPage.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                title: newTitle,
                lastModified: new Date().toISOString().split('T')[0],
                author: user?.username || "Contributeur"
              }
            : section
        );

        return {
          ...prev,
          [pageId]: {
            ...currentPage,
            sections: updatedSections,
            lastModified: new Date().toISOString().split('T')[0],
          }
        };
      }
      return prev;
    });

    return true;
  };

  const deleteSection = (pageId: string, sectionId: string): boolean => {
    if (!wikiData[pageId]?.sections) {
      console.warn(`La page "${pageId}" n'a pas de sections`);
      return false;
    }

    const sections = wikiData[pageId].sections!;
    
    // Empêcher la suppression s'il ne reste qu'une section
    if (sections.length <= 1) {
      console.warn(`Impossible de supprimer la dernière section de la page "${pageId}"`);
      return false;
    }

    setWikiData(prev => {
      const currentPage = prev[pageId];
      if (currentPage?.sections) {
        const updatedSections = currentPage.sections.filter(section => section.id !== sectionId);

        return {
          ...prev,
          [pageId]: {
            ...currentPage,
            sections: updatedSections,
            lastModified: new Date().toISOString().split('T')[0],
          }
        };
      }
      return prev;
    });

    return true;
  };

  return (
    <WikiContext.Provider value={{
      currentPage,
      setCurrentPage,
      wikiData,
      updatePage,
      addSection,
      addPage,
      renamePage,
      deletePage,
      renameSection,
      deleteSection,
      isEditing,
      setIsEditing,
      editingPage,
      setEditingPage,
      searchTerm,
      setSearchTerm,
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser,
      updateUser,
      isAdminPanelOpen,
      setIsAdminPanelOpen,
      openAdminPanel,
      allUsers,
      setAllUsers,
      updateUserTags,
      updateUserProfile,
      deleteUserProfile,
      hasPermission,
      canContribute,
      isAdmin,
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </WikiContext.Provider>
  );
};

export const useWiki = () => {
  const context = useContext(WikiContext);
  if (context === undefined) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
};