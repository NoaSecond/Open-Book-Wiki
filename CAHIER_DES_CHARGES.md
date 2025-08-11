# Cahier des charges - Open Book Wiki

## 📋 Informations générales

**Nom du projet** : Open Book Wiki  
**Version** : 1.0.0  
**Type** : Plateforme wiki collaborative  
**Licence** : MIT  
**Date de création** : Août 2025  

## 🎯 Objectif du projet

Open Book Wiki est une plateforme de documentation collaborative moderne, conçue pour permettre aux équipes et aux individus de créer, organiser et partager leurs connaissances de manière efficace et intuitive.

## 📊 Vue d'ensemble technique

### Architecture
- **Type** : Application web full-stack
- **Frontend** : Single Page Application (SPA)
- **Backend** : API REST
- **Base de données** : SQLite embarquée
- **Déploiement** : Serveur local ou cloud

### Technologies utilisées

#### Frontend
- **Framework** : React 18 avec TypeScript
- **Styling** : Tailwind CSS
- **Build Tool** : Vite
- **Icônes** : Lucide React
- **Drag & Drop** : @dnd-kit
- **Linting** : ESLint

#### Backend
- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** : SQLite3
- **Authentification** : JWT + bcryptjs
- **Sécurité** : Helmet, CORS, Rate Limiting
- **Logging** : Morgan

## 🎨 Interface utilisateur et fonctionnalités détaillées

### **HEADER (Barre supérieure)**

#### Logo et navigation principale
- **Cliquer sur le logo/icône** : Redirige vers la première page de navigation
- **Cliquer sur le titre "Open Book Wiki"** : Redirige vers la première page de navigation selon l'ordre défini dans la sidebar
  - Priorité 1 : Première page de l'ordre personnalisé (localStorage 'wiki_pages_order')
  - Priorité 2 : Page "Accueil" si elle existe
  - Priorité 3 : Première page disponible dans wikiData
  - Fallback : Page 'home'

#### Édition du titre
- **Bouton éditer (crayon) à côté du titre** : Active le mode édition du nom du projet
  - Remplace le titre par un champ input
  - Validation : Entrée ou clic sur icône de validation
  - Annulation : Échap ou clic sur icône d'annulation
  - Impact : Modifie le nom affiché dans l'onglet du navigateur et dans toute l'application
  - Persiste dans la configuration via configService.setSiteName()
  - Force un rechargement de la page (window.location.reload())

#### Barre de recherche
- **Champ de recherche central** : Recherche en temps réel dans le contenu
  - Recherche dans les titres de pages
  - Recherche dans le contenu des pages
  - Recherche dans les sections si elles existent
  - Résultats affichés dans MainContent avec surlignage
  - Minimum 2 caractères pour déclencher la recherche

#### Zone d'authentification
- **Utilisateur non connecté** :
  - Bouton "Se connecter" : Ouvre la modal de connexion LoginModal
  - Bouton de basculement de thème : Icône dynamique (Soleil/Lune) à droite du bouton "Se connecter", permettant de changer entre mode sombre et clair
- **Utilisateur connecté** :
  - Affiche le UserMenu avec avatar et nom d'utilisateur (le bouton de thème est disponible dans le menu)

### **USER MENU (Menu utilisateur)**

#### Déclenchement
- **Clic sur l'avatar/nom** : Ouvre/ferme le menu déroulant
- **Clic en dehors** : Ferme le menu automatiquement

#### Informations utilisateur
- **Avatar** : Affiche l'image personnalisée ou initiales sur fond dégradé
- **Nom d'utilisateur** : Affiché en gras
- **Tags utilisateur** : Affiche le premier tag avec couleur + compteur s'il y en a plus

#### Actions disponibles
- **Bouton "Profil"** : Navigue vers la page profil (setCurrentPage('profile'))
- **Bouton de basculement de thème** : 
  - Affiche "Mode clair" avec icône Soleil si en mode sombre
  - Affiche "Mode sombre" avec icône Lune si en mode clair
  - Clic bascule entre les deux thèmes via toggleDarkMode()
  - Sauvegarde la préférence dans localStorage ('wiki_dark_mode')
  - Ferme le menu après basculement
- **Bouton "Panel Admin"** (admin uniquement) : Ouvre le SimpleAdminPanel
- **Bouton "Se déconnecter"** : 
  - Appelle la fonction logout()
  - Redirige vers la page d'accueil
  - Ferme le menu

### **LOGIN MODAL (Modal de connexion)**

#### Interface
- **Overlay sombre** : Arrière-plan semi-transparent
- **Modal centrée** : Formulaire de connexion avec thème adaptatif
- **Bouton fermeture (X)** : Ferme la modal sans action

#### Formulaire
- **Champ nom d'utilisateur** : Input avec icône utilisateur
- **Champ mot de passe** : Input avec icône cadenas
- **Validation** : Entrée déclenche la soumission
- **Bouton "Se connecter"** : 
  - Désactivé si champs vides
  - Affiche "Connexion..." pendant le traitement
  - En cas de succès : ferme la modal et met à jour l'état utilisateur
  - En cas d'erreur : affiche le message d'erreur

#### Gestion des erreurs
- **Affichage des erreurs** : Messages d'erreur du serveur affichés en rouge
- **États de chargement** : Indicateur visuel pendant l'authentification

### **SIDEBAR (Barre latérale)**

#### Navigation principale
- **Liste des pages** : Affichage dynamique basé sur wikiData
- **Ordre personnalisé** : Système de drag & drop pour réorganiser les pages
  - Sauvegarde dans localStorage ('wiki_pages_order')
  - Mise à jour en temps réel avec orderUpdateTrigger
- **Pages avec icônes** : Chaque page a une icône SVG personnalisable
- **Page active** : Mise en surbrillance de la page actuellement consultée

#### Gestion des pages (Admin)
- **Menu d'options (...)** par page :
  - **Renommer** : Édition inline du titre de la page
  - **Supprimer** : Suppression avec confirmation
- **Validation renommage** : Entrée ou clic validation
- **Annulation** : Échap ou clic annulation

#### Création de contenu
- **Bouton "Nouvelle page"** : 
  - Ouvre une modal de création
  - Sélection d'icône parmi une galerie prédéfinie
  - Création via addPage() du contexte
- **Activités récentes** : 
  - Affiche les 3 dernières activités de modification
  - Filtrées sur edit_page, edit_section, create_page, create_section
  - Avec timestamps relatifs

#### Informations système
- **Version de l'application** : Affichée en bas de la sidebar
- **Indicateur de connexion** : Statut de la connexion backend

### **MAIN CONTENT (Zone de contenu principale)**

#### Affichage des pages
- **En-tête de page** :
  - Titre principal de la page
  - Métadonnées : auteur, date de modification
  - Bouton "Ajouter une section" (contributeurs uniquement)

#### Système de sections
- **Parsing automatique** : Détection des titres Markdown (H1-H6)
- **Sections collapsibles** : 
  - Clic sur l'en-tête toggle l'affichage
  - Icône chevron indique l'état (ouvert/fermé)
  - Sauvegarde de l'état d'expansion par section
- **Édition par section** :
  - Bouton "crayon" sur chaque section (contributeurs)
  - Ouvre EditModal avec le contenu de la section
  - Métadonnées : date de modification et auteur

#### Rendu du contenu
- **MarkdownRenderer** : Conversion Markdown vers HTML
- **CollapsibleSections** : Composant pour l'affichage structuré
- **Navigation interne** : Ancres automatiques pour chaque section

#### Résultats de recherche
- **Mode recherche** : Remplace l'affichage normal quand searchTerm existe
- **Liste des résultats** : Pages correspondantes avec extraits
- **Sections correspondantes** : Affichage des sections avec contenu recherché
- **Message vide** : "Aucun résultat trouvé" si pas de correspondance

#### Pages spéciales
- **Page Profil** : Affichage de ProfilePage pour currentPage === 'profile'
- **Page Membres** : Affichage de MembersPage pour currentPage === 'members'
- **Page inexistante** : Message d'erreur avec proposition de création

### **EDIT MODAL (Modal d'édition)**

#### Interface générale
- **Modal plein écran** (90% viewport) avec overlay
- **Header** : Titre "Modifier : [Nom de la page/section]"
- **Boutons de contrôle** : Aperçu, Sauvegarder, Annuler

#### Modes d'édition
- **Mode Éditeur** : Textarea avec syntaxe Markdown
  - Police monospace pour le code
  - Placeholder avec instructions
  - Redimensionnement vertical désactivé
- **Mode Aperçu** : Rendu du Markdown avec MarkdownRenderer
  - Bascule via bouton "Aperçu"/"Éditer"
  - Prévisualisation en temps réel

#### Édition de sections
- **Champ titre de section** : Input dédié pour modifier le titre
- **Contenu de section** : Textarea pour le contenu Markdown
- **Détection** : Identifie si c'est une section via format "pageId:sectionId"

#### Actions
- **Sauvegarder** :
  - Si le titre de section a été modifié : appelle renameSectionTitle() en premier pour mettre à jour les balises de délimitation
  - Toutes les sections utilisent le même format de balises HTML (<!-- SECTION:sectionId:titre -->)
  - Les sections par défaut sont automatiquement converties au format avec balises lors du premier chargement
  - Puis appelle updatePage() avec le contenu de la section
  - Ferme la modal et recharge les données
  - Logs détaillés pour le débogage
- **Annuler** : Ferme la modal sans sauvegarder
- **Raccourcis clavier** : Support prévu pour Ctrl+S, Échap

#### Informations contextuelles
- **Footer informatif** : 
  - Astuces syntaxe Markdown
  - Timestamp de dernière modification
  - Indicateurs visuels de l'état

### **PROFILE PAGE (Page de profil)**

#### Informations utilisateur
- **Avatar** : Affichage avec option de modification (AvatarEditor)
- **Informations de base** :
  - Nom d'utilisateur (éditable)
  - Email (éditable)
  - Date d'inscription
  - Nombre de contributions
- **Biographie** : Textarea éditable pour description personnelle

#### Gestion des tags
- **Affichage des tags** : Liste colorée des rôles/permissions
- **Icônes par type** : 
  - Administrateur : Shield
  - Contributeur : UserCheck
  - Visiteur : Eye

#### Mode édition
- **Basculement** : Bouton "Modifier le profil" / "Sauvegarder"
- **Champs éditables** : Username, email, bio
- **Validation** : Vérification des champs avant sauvegarde
- **Annulation** : Restauration des valeurs originales

### **MEMBERS PAGE (Page des membres)**

#### Restriction d'accès
- **Vérification admin** : Seuls les administrateurs peuvent accéder
- **Message d'erreur** : "Accès refusé" pour les non-autorisés

#### Liste des utilisateurs
- **Grille responsive** : Affichage en cartes des utilisateurs
- **Informations par utilisateur** :
  - Avatar et nom d'utilisateur
  - Date d'inscription et dernière connexion
  - Tags avec couleurs et icônes
  - Nombre de contributions

#### Gestion des profils
- **Bouton édition** : Ouvre UserProfileModal pour chaque utilisateur
- **Modal d'édition** : Permet de modifier tous les aspects du profil
- **Gestion des tags** : Attribution/retrait des rôles
- **Sauvegarde** : Mise à jour via l'API backend

### **SIMPLE ADMIN PANEL (Panneau d'administration)**

#### Accès et interface
- **Restriction** : Administrateurs uniquement
- **Ouverture** : Via UserMenu ou prop isOpenFromMenu
- **Interface à onglets** : Navigation entre différentes sections

#### Onglet Activités
- **Journal complet** : Toutes les activités du système
- **Informations par activité** :
  - Timestamp, utilisateur, action, cible, détails
  - IP et User-Agent si disponibles
- **Filtrage** : Par utilisateur, type d'action, période

#### Onglet Utilisateurs
- **Liste complète** : Tous les utilisateurs inscrits
- **Recherche** : Filtrage par nom d'utilisateur
- **Édition en ligne** : Modal UserProfileModal intégrée
- **Statistiques** : Score de permissions, dernière activité

#### Onglet Base de données
- **Vue d'ensemble** : Statistiques générales (users, pages, activities)
- **Sous-onglets** :
  - **Utilisateurs** : Table avec détails complets, option masquer/afficher mots de passe
  - **Pages** : Liste des pages avec métadonnées
  - **Activités** : Journal technique des actions système

#### Onglet Tags
- **CRUD complet** : Création, lecture, modification, suppression des tags
- **Personnalisation** : Couleurs, descriptions
- **Gestion des permissions** : Attribution des droits par tag

#### Onglet Permissions
- **Matrice de permissions** : Vue d'ensemble tags/permissions
- **Édition granulaire** : Activation/désactivation par couple tag-permission
- **Catégories** : Admin, Content, User
- **Sauvegarde automatique** : Indicateur de modifications non sauvegardées

### **USER PROFILE MODAL (Modal de profil utilisateur)**

#### Interface
- **Modal responsive** : S'adapte au contenu
- **Header** : Titre "Profil de [username]" avec bouton fermeture

#### Modes d'affichage
- **Mode consultation** : Affichage read-only des informations
- **Mode édition** : Formulaires éditables pour admin/utilisateur

#### Gestion de l'avatar
- **Affichage** : Avatar actuel ou placeholder
- **Modification** : Bouton d'édition ouvre AvatarEditor
- **Sélection** : Galerie d'avatars prédéfinis

#### Informations éditables
- **Nom d'utilisateur** : Input avec validation
- **Email** : Input avec validation format email
- **Biographie** : Textarea multiligne
- **Tags** : Checkboxes pour sélection multiple (admin uniquement)

#### Actions
- **Sauvegarder** : Validation et envoi des modifications
- **Annuler** : Restauration des valeurs originales
- **États** : Loading pendant sauvegarde, désactivation des boutons

### **AVATAR EDITOR (Éditeur d'avatar)**

#### Interface
- **Modal dédiée** : Sélection parmi avatars prédéfinis
- **Galerie** : Grid d'avatars disponibles
- **Aperçu** : Avatar sélectionné mis en évidence

#### Fonctionnalités
- **Sélection** : Clic pour choisir un avatar
- **Sauvegarde** : Application de l'avatar à l'utilisateur
- **Annulation** : Fermeture sans modification

## 🔍 Fonctionnalités de recherche

### Recherche globale
- **Déclenchement** : 2 caractères minimum dans la barre de recherche
- **Scope** : Titres et contenu des pages, sections si disponibles
- **Affichage** : Remplacement du contenu principal par les résultats
- **Performance** : Recherche côté client avec filtrage optimisé

### Navigation et ancres
- **Ancres automatiques** : Génération d'ID pour chaque section
- **Navigation interne** : Liens directs vers sections spécifiques
- **Breadcrumbs** : Localisation dans l'arborescence (futur)

## 👥 Système d'authentification et permissions

### Authentification
- **Login/Logout** : JWT avec localStorage persistant
- **Sessions** : Token valide 7 jours
- **Sécurité** : Hashage bcrypt côté serveur

### Rôles et permissions
- **Administrateur** : Accès complet, gestion des utilisateurs, panel admin
- **Contributeur** : Édition de contenu, gestion de profil
- **Visiteur** : Consultation uniquement

### Système de tags
- **Attribution** : Association utilisateur-tags many-to-many
- **Permissions héritées** : Cumul des droits par tags
- **Gestion centralisée** : Interface admin pour la configuration

## 📊 Journalisation et activités

### Types d'activités
- **Authentification** : login, logout, profil mis à jour
- **Contenu** : create_page, edit_page, delete_page, edit_section
- **Administration** : gestion utilisateurs, modifications système

### Stockage
- **Base de données** : Table activities avec métadonnées JSON
- **Rétention** : Pas de limite de rétention actuellement
- **Performance** : Pagination pour l'affichage

### Affichage
- **Historique personnel** : Activités de l'utilisateur (sidebar)
- **Historique global** : Toutes activités (panel admin)
- **Filtrage** : Par type, utilisateur, période

## 💾 Structure de données

### Tables principales
- **users** : Comptes utilisateurs avec métadonnées
- **wiki_pages** : Contenu des pages avec versioning
- **activities** : Journal des actions utilisateur
- **tags** : Rôles et catégories
- **permissions** : Droits système
- **tag_permissions** : Association tags-permissions

### Configuration
- **localStorage** : Préférences utilisateur, ordre des pages
- **configService** : Paramètres système (nom, description)
- **Persistance** : Sauvegarde automatique des modifications

## 🎨 Interface et expérience utilisateur

### Thèmes
- **Mode sombre** : Thème par défaut avec Tailwind CSS
- **Mode clair** : Alternative avec adaptation automatique
- **Basculement** : Bouton dans le UserMenu avec icônes dynamiques (Soleil/Lune), persistance localStorage
- **Basculement** : Bouton dans le header, persistance localStorage

### Responsive
- **Mobile-first** : Interface adaptative
- **Breakpoints** : Adaptation tablette/desktop
- **Navigation mobile** : Sidebar collapsible

### Accessibilité
- **Contraste** : Respect des standards WCAG
- **Navigation clavier** : Support des raccourcis
- **Screen readers** : Attributs ARIA appropriés

### Performance
- **Hot Module Replacement** : Rechargement à chaud en développement
- **Optimisation bundle** : Tree shaking et code splitting
- **Lazy loading** : Chargement différé des composants lourds

## 🔧 Architecture technique

### Frontend (React + TypeScript)
- **État global** : Context API (WikiContext)
- **Hooks personnalisés** : useWiki, useCallback pour l'optimisation
- **Type safety** : TypeScript strict, interfaces centralisées
- **Qualité** : ESLint + TypeScript sans erreurs ni warnings

### Backend (Node.js + Express)
- **API REST** : Endpoints pour auth, wiki, admin
- **Middleware** : CORS, Helmet, Rate limiting
- **Base de données** : SQLite avec requêtes optimisées
- **Sécurité** : Validation des entrées, protection CSRF

### Déploiement
- **Développement** : Vite dev server (port 5176) + Node.js (port 3001)
- **Production** : Build optimisé avec assets statiques
- **Configuration** : Variables d'environnement pour adaptation

Cette spécification détaille exhaustivement toutes les fonctionnalités implémentées dans Open Book Wiki, servant de référence complète pour le développement et la maintenance du projet.
- **Permissions** : Jeu complet de permissions par catégorie

## 🔒 Sécurité

### Authentification
- **JWT** : Tokens sécurisés avec expiration
- **Hashage** : bcrypt pour les mots de passe
- **Validation** : Vérification côté serveur

### Autorisations
- **Middleware** : Vérification permissions sur routes sensibles
- **RBAC** : Contrôle d'accès basé sur les rôles
- **Validation** : Contrôles front et back-end

### Protection
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Configuration cross-origin
- **Rate limiting** : Protection contre le spam
- **Injection SQL** : Requêtes préparées SQLite

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 768px
- **Tablet** : 768px - 1024px
- **Desktop** : > 1024px

### Adaptations
- **Navigation** : Sidebar collapsible sur mobile
- **Édition** : Interface tactile optimisée
- **Modales** : Redimensionnement automatique

## 🚀 Performance

### Frontend
- **Lazy loading** : Chargement composants à la demande
- **Optimisation** : Build Vite avec tree-shaking
- **Cache** : Mise en cache des ressources statiques

### Backend
- **Index** : Index de base de données optimisés
- **Pagination** : Chargement par lots des données
- **Compression** : Gzip pour les réponses HTTP

## 🔄 API REST

### Structure
- **Base URL** : `/api`
- **Versioning** : Préparé pour versioning futur
- **Format** : JSON uniquement

### Endpoints principaux

#### Authentification (`/api/auth`)
- `POST /login` : Connexion utilisateur
- `POST /register` : Inscription utilisateur
- `GET /verify` : Vérification token
- `GET /me` : Informations utilisateur connecté
- `POST /logout` : Déconnexion

#### Wiki (`/api/wiki`)
- `GET /` : Liste toutes les pages
- `GET /:id` : Page spécifique
- `POST /` : Créer nouvelle page
- `PUT /:id` : Modifier page
- `DELETE /:id` : Supprimer page

#### Tags (`/api/tags`)
- `GET /` : Liste tous les tags
- `POST /` : Créer nouveau tag
- `PUT /:id` : Modifier tag
- `DELETE /:id` : Supprimer tag

#### Permissions (`/api/permissions`)
- `GET /` : Liste permissions
- `GET /by-category` : Permissions par catégorie
- `POST /` : Créer permission
- `PUT /:id` : Modifier permission
- `DELETE /:id` : Supprimer permission

#### Activités (`/api/activities`)
- `GET /` : Historique activités
- `GET /user/:id` : Activités utilisateur spécifique

## 📦 Déploiement

### Prérequis
- **Node.js** : Version 16+ recommandée
- **NPM** : Pour gestion des dépendances
- **Port** : 3001 (backend), 5176 (frontend dev)

### Installation
1. **Clone** : `git clone https://github.com/NoaSecond/Open-Book-Wiki`
2. **Dépendances** : `npm install` (frontend + backend)
3. **Base** : Création automatique base SQLite
4. **Démarrage** : `npm run dev` (frontend), `npm start` (backend)

### Configuration
- **Variables d'environnement** : Port, JWT secret, CORS
- **Base de données** : Chemin configurable SQLite
- **Logs** : Niveau de logging ajustable

## 🔮 Évolutions futures

### Fonctionnalités envisagées
- **Versioning** : Historique des modifications pages
- **Commentaires** : Système de commentaires par page
- **Notifications** : Alertes modifications importantes
- **Export** : Export PDF/Word des pages
- **Thèmes** : Personnalisation avancée interface
- **Plugins** : Système d'extensions
- **API externe** : Intégration services tiers

### Améliorations techniques
- **Websockets** : Édition collaborative temps réel
- **Cache Redis** : Optimisation performance
- **Base externe** : Support PostgreSQL/MySQL
- **SSR** : Server-Side Rendering
- **PWA** : Application web progressive
- **Tests** : Suite de tests automatisés

## 📞 Support et maintenance

### Documentation
- **README** : Guide installation et utilisation
- **Code** : Commentaires et documentation inline
- **API** : Documentation endpoints (futur Swagger)

### Maintenance
- **Logs** : Système de logging complet
- **Erreurs** : Gestion centralisée des erreurs
- **Monitoring** : Surveillance performance (à implémenter)

### Communauté
- **Issues** : GitHub pour signalement bugs
- **Contributions** : Guide contribution avec Gitmoji
- **License** : MIT pour usage libre

---

*Ce cahier des charges représente l'état actuel d'Open Book Wiki et ses spécifications techniques. Il peut évoluer selon les besoins et retours utilisateurs.*
