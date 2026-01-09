# Tests avec Jest et MongoDB Memory Server

Ce dossier contient tous les tests unitaires et d'intégration pour le serveur FouFouFood.

**Statistiques :** 227 tests au total répartis sur 7 fichiers de test

## Configuration

Les tests utilisent :
- **Jest** : Framework de test
- **MongoDB Memory Server** : Base de données MongoDB en mémoire (pas besoin d'installer MongoDB)
- **Supertest** : Tests d'intégration des routes Express

## Structure

- `setup.js` : Configuration globale (MongoDB Memory Server, nettoyage)
- `helpers.js` : Fonctions utilitaires pour créer des données de test (users, admins, restaurant admins, delivery partners)
- `*.test.js` : Fichiers de tests par domaine

## Fichiers de tests

### `auth.test.js` (31 tests)
Tests d'authentification complets :
- **Inscription (sign-up)** : création d'utilisateur, validation des champs, normalisation email, validation mot de passe, rôles autorisés, refus des doublons
- **Connexion (sign-in)** : authentification réussie, refus avec mauvais identifiants, normalisation email
- **Déconnexion (sign-out)** : déconnexion réussie, refus sans token, refus avec token invalide/expiré, révocation de token
- **Middleware authorize** : validation de token, refus sans authentification

### `user.test.js` (23 tests)
Tests de gestion des utilisateurs :
- **GET /users/:id** : récupération du profil, accès restreint (un user ne peut voir que son propre profil sauf platform_admin)
- **PUT /users/:id** : mise à jour du profil, validation email unique, validation du mot de passe, refus de changement de rôle
- **DELETE /users/:id** : suppression du compte, nettoyage des sessions Redis
- **GET /users/search** : recherche d'utilisateurs
- **Permissions** : vérification que les users ne peuvent pas accéder aux profils d'autres users

### `admin.test.js` (10 tests)
Tests des routes admin (platform_admin seulement) :
- **POST /admin/restaurants** : création de restaurant avec nouvel admin, création avec admin existant, validation des champs, vérification des mots de passe, association des restaurants

### `restaurant.test.js` (48 tests)
Tests de gestion des restaurants :
- **POST /restaurants** : création de restaurant (restaurant_admin seulement), création de plusieurs restaurants par le même admin
- **GET /restaurants** : récupération de tous les restaurants, recherche de restaurants
- **GET /restaurants/me** : récupération des restaurants de l'utilisateur connecté
- **GET /restaurants/:id** : récupération d'un restaurant par ID
- **PUT /restaurants/:id** : mise à jour de restaurant (propriétaire seulement)
- **DELETE /restaurants/:id** : suppression de restaurant
- **POST /restaurants/:id/reviews** : ajout/mise à jour d'avis client (note + commentaire), recalcul automatique de la note moyenne
- **DELETE /restaurants/:id/reviews** : suppression d'avis client, recalcul automatique de la note moyenne
- **Permissions** : vérification que seul le propriétaire peut modifier/supprimer ses restaurants

### `menu.test.js` (28 tests)
Tests de gestion des menus :
- **POST /menus** : ajout d'item de menu (restaurant_admin seulement, refus pour platform_admin)
- **GET /menus** : récupération des items d'un restaurant
- **GET /menus/search** : recherche d'items de menu
- **GET /menus/:id** : récupération d'un item par ID
- **PUT /menus/:id** : mise à jour d'item (refus de changement de restaurant)
- **DELETE /menus/:id** : suppression d'item
- **Validations** : vérification des champs requis, validation des prix (pas négatifs), refus pour non-propriétaire

### `order.test.js` (46 tests)
Tests de gestion des commandes :
- **POST /orders** : création depuis panier ou manuelle, validation des items, vérification du restaurant, vidage du panier après création
- **GET /orders** : récupération des commandes avec pagination et filtres par statut
- **GET /orders/:id** : récupération d'une commande (permissions selon rôle : client, restaurant_admin, delivery_partner, platform_admin)
- **PUT /orders/:id/status** : mise à jour du statut (permissions selon rôle et statut)
- **PUT /orders/:id/cancel** : annulation de commande (client seulement, refus si déjà livrée/annulée)
- **POST /orders/:id/assign** : assignation d'une commande à un delivery_partner (statut Préparée seulement)
- **GET /orders/delivery/available** : commandes disponibles pour assignation
- **GET /orders/delivery/me** : commandes assignées au livreur
- **Permissions** : vérification complète des permissions pour tous les rôles

### `cart.test.js` (41 tests)
Tests de gestion du panier :
- **GET /cart** : récupération du panier (vide ou avec items)
- **POST /cart/items** : ajout d'item, cumul de quantité pour même item, validation restaurant unique, refus items d'un autre restaurant
- **PUT /cart/items/:menuItemId** : mise à jour de quantité, suppression si quantité = 0
- **DELETE /cart/items/:menuItemId** : suppression d'item, conservation des autres items
- **DELETE /cart** : vidage complet du panier
- **GET /cart/stats** : statistiques du panier
- **POST /cart/validate** : validation du panier avant commande, recalcul des prix, vérification disponibilité des items
- **Permissions** : tous les endpoints nécessitent le rôle client
- **Normalisation IDs** : gestion correcte ObjectId vs String pour comparaisons Redis/MongoDB

## Exécution des tests

```bash
# Exécuter tous les tests (227 tests)
npm test

# Exécuter un fichier de test spécifique
npm test -- auth.test.js
npm test -- user.test.js
npm test -- admin.test.js
npm test -- restaurant.test.js
npm test -- menu.test.js
npm test -- order.test.js
npm test -- cart.test.js

# Exécuter les tests en mode watch
npm test -- --watch

# Exécuter les tests avec couverture de code
npm test -- --coverage

# Exécuter un test spécifique par nom
npm test -- --testNamePattern="devrait créer une commande"
```

## Fonctionnalités testées

### Authentification
- ✅ Inscription avec validation complète (email, mot de passe, rôles)
- ✅ Connexion avec gestion des sessions
- ✅ Déconnexion et révocation de tokens
- ✅ Protection des routes avec middleware `authorize`

### Gestion des utilisateurs
- ✅ CRUD complet des utilisateurs
- ✅ Contrôle d'accès strict (un user ne peut voir que son profil)
- ✅ Exceptions pour platform_admin (peut voir tous les profils)
- ✅ Validation et nettoyage lors de la suppression

### Gestion des restaurants
- ✅ CRUD complet des restaurants
- ✅ Un restaurant_admin peut créer plusieurs restaurants
- ✅ Avis et notes clients (ajout, mise à jour, suppression)
- ✅ Recalcul automatique de la note moyenne

### Gestion des menus
- ✅ CRUD complet des items de menu
- ✅ Recherche et filtrage
- ✅ Restrictions de permissions (restaurant_admin seulement, pas platform_admin)
- ✅ Validation des prix et champs requis

### Gestion des commandes
- ✅ Création depuis panier ou manuelle
- ✅ Gestion complète des statuts (En attente, Confirmée, Préparée, En livraison, Livrée, Annulée)
- ✅ Assignation aux livreurs (delivery_partner)
- ✅ Permissions complexes selon les rôles
- ✅ Pagination et filtres
- ✅ Validation des items et restaurants

### Gestion du panier
- ✅ Ajout, modification, suppression d'items
- ✅ Cumul de quantité pour même item
- ✅ Validation que tous les items sont du même restaurant
- ✅ Validation et recalcul des prix
- ✅ Statistiques du panier

## Fonctionnalités techniques

- ✅ Base de données MongoDB en mémoire (isolée par test)
- ✅ Nettoyage automatique après chaque test
- ✅ Helpers pour créer des utilisateurs de test facilement
- ✅ Tests d'intégration avec Supertest
- ✅ Pas besoin de MongoDB ou Redis installé localement
- ✅ Normalisation des IDs (ObjectId vs String) pour compatibilité Redis/MongoDB

## Variables d'environnement

Les tests définissent automatiquement dans `setup.js` (AVANT tout import) :
- `NODE_ENV=test` - Force le mode test
- `JWT_SECRET` (si non défini)
- `REDIS_URL` (par défaut: redis://localhost:6379)
- `MONGODB_URI` (dummy value, non utilisé - MongoDB Memory Server est utilisé à la place)

## Isolation de l'environnement

Tous les tests s'exécutent dans un **environnement de test complet** qui est isolé de l'environnement de développement :

### Base de données MongoDB
- ✅ Utilise **MongoDB Memory Server** (base en mémoire)
- ✅ Ne se connecte **jamais** à la vraie base MongoDB de développement
- ✅ Se nettoie automatiquement après chaque test

### Redis
- ✅ Utilise un **mock Redis en mémoire** (pas besoin de Redis installé)
- ✅ Simule toutes les opérations Redis (`get`, `set`, `del`, `keys`)
- ✅ Supporte l'expiration automatique des clés (`EX`)
- ✅ Se nettoie automatiquement après chaque test

### Serveur HTTP
- ✅ Le serveur HTTP **ne démarre pas** en mode test (`app.js` vérifie `NODE_ENV !== 'test'`)
- ✅ Les tests utilisent Supertest pour les requêtes HTTP (pas besoin de serveur tournant)

### Seed Admin
- ✅ `seedAdmin()` ne s'exécute **pas** en mode test

### Configuration
- ✅ `config/db.js` : ignore la connexion MongoDB en mode test
- ✅ `config/redis.js` : retourne un mock Redis en mode test
- ✅ `app.js` : ne démarre pas le serveur en mode test

## Notes

- Les tests sont complètement isolés - chaque test démarre avec une base de données vide
- Redis mock est nettoyé automatiquement après les tests
- Les tokens JWT sont générés automatiquement pour les tests authentifiés
- **Aucune dépendance externe nécessaire** : pas besoin de MongoDB ou Redis installé localement

