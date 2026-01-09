# Auteurs

Théodore Grignard
Xavier Dostie
Sébastien Drezet
Tony Besse

# 🍕 FoufouFood Client Web

Client web Angular pour la plateforme FoufouFood - Application de livraison de repas avec système de commandes complet, gestion du panier virtuel, attribution des livreurs et notifications en temps réel.

## 📋 Table des Matières

- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancement](#lancement)
- [Configuration](#configuration)
- [Structure du Projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [Scripts Disponibles](#scripts-disponibles)

## 🛠 Technologies

- **Angular 20.3** - Framework frontend
- **TypeScript 5.9** - Langage de programmation
- **RxJS 7.8** - Programmation réactive
- **Socket.IO Client** - Notifications en temps réel
- **Angular PWA** - Support Progressive Web App
- **SCSS** - Préprocesseur CSS

## 🔧 Prérequis

- **Node.js** (version 18 ou supérieure)
  - Vérifier : `node --version`
  - Télécharger : [nodejs.org](https://nodejs.org/)
  
- **npm** (généralement inclus avec Node.js)
  - Vérifier : `npm --version`
  
- **Le serveur backend** doit être en cours d'exécution
  - Par défaut sur `http://localhost:3000`
  - Voir le README du serveur pour plus d'informations

## 🚀 Installation

### Étape 1 : Installer les dépendances

```bash
# Installer les dépendances
npm install
```


## ▶️ Lancement

### Mode développement

```bash
# Démarrer le serveur de développement
npm start
```

L'application sera accessible sur `http://localhost:4200`

Le serveur de développement supporte le rechargement automatique (hot-reload) lors des modifications de fichiers.

### Build de production

```bash
# Compiler le projet pour la production
npm run build
```

Les fichiers compilés seront générés dans le dossier `dist/`.

## ⚙️ Configuration

### URL de l'API Backend

L'URL de l'API backend est configurée dans les services. Par défaut, elle pointe vers `http://localhost:3000`.

Pour modifier l'URL de l'API, éditez les fichiers dans `src/app/core/services/` et changez la valeur de `API_URL` dans chaque service.

### Variables d'environnement

Pour la production, vous pouvez créer un fichier d'environnement pour configurer différentes URLs selon l'environnement.

## 📁 Structure du Projet

```
src/
├── app/
│   ├── core/                    # Services, guards, interceptors
│   │   ├── guards/              # Guards d'authentification et de rôles
│   │   ├── interceptors/        # Intercepteurs HTTP
│   │   └── services/            # Services métier (auth, cart, orders, etc.)
│   │
│   ├── features/                # Composants par fonctionnalité
│   │   ├── admin-platform/      # Administration plateforme
│   │   ├── admin-restaurant/    # Administration restaurant
│   │   ├── auth/                # Authentification (login, signup)
│   │   ├── cart/                # Panier d'achat
│   │   ├── checkout/            # Processus de commande
│   │   ├── delivery-orders/     # Commandes pour livreurs
│   │   ├── favorites/           # Restaurants favoris
│   │   ├── home/                # Page d'accueil
│   │   ├── order-confirmation/  # Confirmation de commande
│   │   ├── order-detail/        # Détails d'une commande
│   │   ├── orders-list/         # Liste des commandes
│   │   ├── profile/             # Profil utilisateur
│   │   ├── restaurant-detail/  # Détails d'un restaurant
│   │   └── restaurants-list/   # Liste des restaurants
│   │
│   ├── models/                  # Modèles TypeScript
│   │   ├── api-response.model.ts
│   │   ├── cart.model.ts
│   │   ├── menu.model.ts
│   │   ├── order.model.ts
│   │   ├── restaurant.model.ts
│   │   └── user.model.ts
│   │
│   ├── shared/                  # Composants partagés
│   │   ├── layout/              # Layout principal avec navbar
│   │   └── notifications/        # Composant de notifications
│   │
│   ├── app.config.ts            # Configuration de l'application
│   ├── app.routes.ts            # Routes de l'application
│   └── app.ts                   # Composant racine
│
├── index.html                   # Point d'entrée HTML
├── main.ts                      # Point d'entrée TypeScript
└── styles.scss                  # Styles globaux
```

## 🎯 Fonctionnalités

### Pour tous les utilisateurs

- **Page d'accueil** - Interface d'accueil personnalisée selon le rôle
- **Liste des restaurants** - Parcourir tous les restaurants disponibles
- **Détails restaurant** - Voir le menu et les informations d'un restaurant
- **Authentification** - Connexion et inscription

### Pour les clients

- **Panier d'achat** - Gérer les articles à commander
- **Passer commande** - Processus de checkout complet
- **Mes commandes** - Historique et suivi des commandes
- **Détails de commande** - Suivi en temps réel du statut
- **Favoris** - Sauvegarder les restaurants préférés
- **Notifications** - Notifications en temps réel pour les mises à jour de commande
- **Profil** - Gérer les informations personnelles

### Pour les livreurs

- **Commandes disponibles** - Voir et accepter les commandes à livrer
- **Suivi des livraisons** - Gérer les commandes en cours de livraison

### Pour les administrateurs de restaurant

- **Gestion des restaurants** - Créer et modifier les restaurants
- **Gestion des menus** - Ajouter, modifier et supprimer des plats
- **Gestion des commandes** - Voir et gérer les commandes du restaurant

### Pour les administrateurs de plateforme

- **Administration globale** - Gérer tous les utilisateurs et restaurants
- **Statistiques** - Voir les statistiques de la plateforme

## 📜 Scripts Disponibles

- `npm start` - Lance le serveur de développement Angular
- `npm run build` - Compile le projet pour la production
- `npm run watch` - Compile en mode watch (surveillance des changements)
- `npm test` - Lance les tests unitaires avec Karma/Jasmine
- `ng` - Accès direct à Angular CLI

## 🔐 Authentification

L'application utilise un système d'authentification basé sur JWT (JSON Web Tokens). Les tokens sont stockés dans les cookies HTTP-only pour une sécurité optimale.

### Rôles disponibles

- `client` - Client standard
- `delivery_partner` - Partenaire de livraison
- `restaurant_admin` - Administrateur de restaurant
- `platform_admin` - Administrateur de la plateforme

## 🔔 Notifications en Temps Réel

L'application utilise Socket.IO pour les notifications en temps réel. Les clients reçoivent automatiquement des mises à jour sur :
- Le statut des commandes
- Les nouvelles commandes disponibles (pour les livreurs)
- Les notifications générales

## 📱 Progressive Web App (PWA)

L'application est configurée comme Progressive Web App, permettant :
- L'installation sur appareils mobiles
- Le fonctionnement hors ligne (avec limitations)
- Les notifications push (si configurées)

## 🐛 Dépannage

### Problèmes d'installation

Si vous rencontrez des erreurs lors de `npm install`, utilisez :
```bash
npm install --legacy-peer-deps
```

### Port déjà utilisé

Si le port 4200 est déjà utilisé, Angular vous proposera automatiquement d'utiliser un autre port.

### Erreurs de connexion au backend

Vérifiez que le serveur backend est bien démarré et accessible sur `http://localhost:3000`.

## 📝 Notes de Développement

- Les composants utilisent la syntaxe standalone d'Angular (pas de NgModules)
- Le lazy loading est utilisé pour optimiser les performances
- Les guards d'authentification protègent les routes sensibles
- Les interceptors HTTP gèrent automatiquement l'authentification
