import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WikiData {
  [key: string]: {
    title: string;
    content: string;
    lastModified: string;
    author: string;
  };
}

interface WikiContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  wikiData: WikiData;
  updatePage: (pageId: string, content: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editingPage: string;
  setEditingPage: (page: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // États d'authentification
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  user: { username: string; email: string } | null;
  setUser: (user: { username: string; email: string } | null) => void;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

const initialWikiData: WikiData = {
  home: {
    title: "Accueil - Star Deception Wiki",
    content: `# Bienvenue sur le Wiki Star Deception

Star Deception est un jeu vidéo de science-fiction captivant qui vous plonge dans un univers où la tromperie et la stratégie sont essentielles à la survie.

## À propos du jeu

Dans Star Deception, les joueurs naviguent dans un cosmos hostile où chaque décision peut changer le cours de l'histoire. Explorez des galaxies lointaines, rencontrez des civilisations alien, et découvrez les secrets cachés de l'univers.

## Caractéristiques principales

- **Gameplay stratégique** : Chaque décision compte
- **Univers riche** : Des dizaines de planètes à explorer
- **Personnages complexes** : Des alliés et ennemis mémorables
- **Histoire immersive** : Une narration profonde et engageante

Explorez les différentes sections de ce wiki pour découvrir tous les secrets de Star Deception !`,
    lastModified: "2025-01-27",
    author: "Admin"
  },
  characters: {
    title: "Personnages",
    content: `# Personnages de Star Deception

## Personnages Principaux

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
- Statut : Antagoniste principal

## Personnages Secondaires

Les PNJ jouent un rôle crucial dans l'expérience de jeu, offrant des quêtes, des informations et des défis uniques.`,
    lastModified: "2025-01-27",
    author: "GameMaster"
  },
  gameplay: {
    title: "Gameplay",
    content: `# Gameplay de Star Deception

## Mécaniques de base

### Système de Combat
Le combat dans Star Deception combine stratégie et action en temps réel.

- **Combat spatial** : Pilotez votre vaisseau dans des batailles épiques
- **Combat au sol** : Affrontements tactiques sur les planètes
- **Système de couverture** : Utilisez l'environnement à votre avantage

### Exploration
L'exploration est au cœur de l'expérience Star Deception.

- **Planètes procédurales** : Chaque monde est unique
- **Ressources à collecter** : Minerais, technologies alien
- **Découvertes cachées** : Temples anciens et artefacts mystérieux

### Progression du personnage
- **Système de niveaux** : Gagnez de l'expérience en explorant et combattant
- **Compétences** : Débloquez de nouvelles capacités
- **Équipement** : Améliorez vos armes et votre vaisseau

## Modes de jeu

### Mode Campagne
L'histoire principale de Star Deception, avec plus de 40 heures de contenu.

### Mode Exploration libre
Explorez l'univers à votre rythme sans contraintes narratives.

### Mode Multijoueur
Affrontez d'autres joueurs dans des batailles spatiales intenses.`,
    lastModified: "2025-01-27",
    author: "ProGamer"
  },
  story: {
    title: "Histoire",
    content: `# Histoire de Star Deception

## Contexte

L'année 2387, l'humanité a colonisé plus de 200 systèmes stellaires. Mais une découverte bouleversante va changer le cours de l'histoire...

## Acte I : La Découverte

Tout commence lorsque Captain Nova Sterling découvre un signal mystérieux provenant des confins de la galaxie. Ce signal semble contenir des informations sur une civilisation ancienne disparue depuis des millénaires.

### Chapitres principaux :
1. **Premier Contact** - La découverte du signal
2. **L'Expédition** - Formation de l'équipe d'exploration
3. **Secrets Cachés** - Premières révélations troublantes

## Acte II : La Révélation

L'équipe découvre que cette civilisation ancienne avait développé une technologie capable de manipuler la réalité elle-même. Mais cette découverte attire l'attention d'ennemis redoutables.

### Chapitres principaux :
4. **La Technologie Perdue** - Découverte des artefacts
5. **Trahison** - Un allié révèle sa vraie nature
6. **La Fuite** - Échapper aux forces ennemies

## Acte III : La Confrontation finale

Nova et son équipe doivent empêcher que cette technologie tombe entre de mauvaises mains, même si cela signifie affronter leurs propres démons.

### Chapitres principaux :
7. **Préparatifs** - Rassembler les alliés
8. **La Bataille finale** - Confrontation épique
9. **Épilogue** - Les conséquences des choix du joueur`,
    lastModified: "2025-01-27",
    author: "StoryWriter"
  },
  items: {
    title: "Objets et Équipements",
    content: `# Objets et Équipements

## Armes

### Armes Primaires

**Blaster Plasma MK-VII**
- Dégâts : 45-60
- Portée : Moyenne
- Cadence : Rapide
- Spécial : Peut surcharger pour plus de dégâts

**Fusil à Ions Quantique**
- Dégâts : 80-120
- Portée : Longue
- Cadence : Lente
- Spécial : Ignore les boucliers énergétiques

### Armes Secondaires

**Grenades Plasma**
- Dégâts de zone
- Effet : Brûlure continue
- Quantité max : 6

## Équipements défensifs

### Boucliers Énergétiques

**Bouclier Personnel Standard**
- Protection : 100 points
- Régénération : 5 points/seconde
- Résistance : Énergétique

**Bouclier Adaptatif Alien**
- Protection : 150 points
- Régénération : 8 points/seconde
- Spécial : S'adapte au type de dégâts reçus

## Objets de mission

### Artefacts Anciens

**Cristal de Résonance**
- Permet de déchiffrer les textes aliens
- Nécessaire pour la progression de l'histoire

**Clé Dimensionnelle**
- Ouvre les portails vers d'autres dimensions
- Objet rare et précieux

## Consommables

**Stimpacks**
- Restaure 50 points de vie
- Effet instantané

**Boosters d'Énergie**
- Restaure l'énergie du bouclier
- Durée : 30 secondes`,
    lastModified: "2025-01-27",
    author: "ItemMaster"
  },
  locations: {
    title: "Lieux",
    content: `# Lieux de Star Deception

## Systèmes Stellaires

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
- Lieux secrets : Temples aliens cachés

## Stations Spatiales

### Station Nexus Alpha
- Type : Station commerciale
- Population : 2 millions
- Fonction : Centre de commerce intergalactique
- Services : Marché, Réparations, Informations

### Avant-poste Omega
- Type : Base militaire
- Population : 50 000
- Fonction : Surveillance des frontières
- Particularités : Technologie de pointe

## Lieux Mystérieux

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
};

export const WikiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [wikiData, setWikiData] = useState<WikiData>(initialWikiData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États d'authentification
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  const updatePage = (pageId: string, content: string) => {
    setWikiData(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        content,
        lastModified: new Date().toISOString().split('T')[0],
        author: user?.username || "Contributeur"
      }
    }));
  };

  return (
    <WikiContext.Provider value={{
      currentPage,
      setCurrentPage,
      wikiData,
      updatePage,
      isEditing,
      setIsEditing,
      editingPage,
      setEditingPage,
      searchTerm,
      setSearchTerm,
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser
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