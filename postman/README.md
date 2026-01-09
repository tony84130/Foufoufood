# Collection Postman - FouFouFood API

Ce dossier contient une collection Postman complète pour tester toutes les fonctionnalités de l'API FouFouFood.

## 📦 Import de la collection

1. **Ouvrir Postman**
2. **Importer la collection** :
   - `File > Import...`
   - Sélectionner le fichier `foufoufood.postman_collection.json`
   - La collection "FouFouFood API" sera importée avec toutes les requêtes

## 🔐 Authentification automatique

### Sauvegarde automatique du token
- La requête `Auth > signIn` est configurée pour **automatiquement** sauvegarder le token JWT dans la variable `{{token}}`
- Toutes les autres requêtes utilisent cette variable automatiquement
- Vous n'avez rien à faire après la connexion !

### Workflow recommandé
1. Exécuter `Auth > signUp` pour créer un compte (optionnel)
2. Exécuter `Auth > signIn` pour se connecter (le token est automatiquement sauvegardé)
3. Toutes les autres requêtes fonctionnent automatiquement avec ce token

## 📝 Variables de collection

La collection utilise des variables automatiquement mises à jour :

| Variable | Description | Mise à jour automatique |
|----------|-------------|------------------------|
| `{{baseUrl}}` | URL de base du serveur (défaut: `http://localhost:3000`) | Non |
| `{{token}}` | Token JWT d'authentification | ✅ Après `signIn` |
| `{{restaurantId}}` | ID d'un restaurant | ✅ Après création de restaurant |
| `{{menuItemId}}` | ID d'un item de menu | ✅ Après création d'item |
| `{{userId}}` | ID d'un utilisateur | Non |
| `{{orderId}}` | ID d'une commande | ✅ Après création de commande |

## 🗂️ Structure de la collection

### 1. **Auth** - Authentification
- `signUp` - Inscription (rôles: `client` ou `delivery_partner` uniquement)
- `signIn` - Connexion (sauvegarde automatique du token)
- `signOut` - Déconnexion (révoque le token)

### 2. **Users** - Gestion des utilisateurs
**Permissions :** Authentification requise
- `getUserById` - Obtenir un utilisateur (un user ne peut voir que son profil sauf platform_admin)
- `searchUsers` - Rechercher des utilisateurs (platform_admin seulement)
- `updateUser` - Mettre à jour un utilisateur (pas de changement de rôle)
- `deleteUser` - Supprimer un utilisateur (propre compte ou platform_admin)

### 3. **Admin** - Routes administrateur
**Permissions :** Token `platform_admin` requis
- `createRestaurantWithAdmin` - Créer un restaurant et son admin en une seule requête
  - Si l'admin existe déjà, le restaurant lui est associé
  - Retourne le restaurant créé et les infos de l'admin

### 4. **Restaurants** - Gestion des restaurants
**Routes publiques :**
- `getRestaurants` - Liste de tous les restaurants
- `searchRestaurants` - Recherche de restaurants (nom, adresse, cuisine)
- `getRestaurantById` - Détails d'un restaurant

**Routes authentifiées :**
- `getMyRestaurants` - Mes restaurants (restaurant_admin seulement)
- `createRestaurant` - Créer un restaurant (restaurant_admin seulement)
- `updateRestaurant` - Modifier un restaurant (propriétaire seulement)
- `deleteRestaurant` - Supprimer un restaurant (propriétaire ou platform_admin)

**Reviews (clients seulement) :**
- `addRestaurantReview` - Ajouter/mettre à jour un avis (rating 1-5 + commentaire optionnel)
- `deleteRestaurantReview` - Supprimer son avis

### 5. **Menus** - Gestion des items de menu
**Routes publiques :**
- `getMenuItems` - Liste des items d'un restaurant
- `searchMenuItems` - Recherche d'items (nom, description)
- `getMenuItemById` - Détails d'un item

**Routes authentifiées (restaurant_admin seulement) :**
- `addMenuItemToRestaurant` - Ajouter un item de menu
- `updateMenuItem` - Modifier un item (pas de changement de restaurant)
- `deleteMenuItem` - Supprimer un item

> ⚠️ **Note :** Les `platform_admin` ne peuvent **pas** ajouter de menus (restriction par rôle)

### 6. **Cart** - Gestion du panier
**Permissions :** Authentification + rôle `client` requis

- `getCart` - Obtenir le panier actuel
- `getCartStats` - Statistiques du panier (nombre d'items, prix total)
- `addToCart` - Ajouter un item (tous les items doivent être du même restaurant)
- `updateCartItem` - Modifier la quantité (si 0, l'item est supprimé)
- `removeFromCart` - Retirer un item
- `clearCart` - Vider complètement le panier
- `validateCart` - Valider le panier avant commande (vérifie disponibilité et prix)

### 7. **Orders** - Gestion des commandes

#### **Client** - Routes pour les clients
**Permissions :** Authentification + rôle `client`

- `createOrderFromCart` - Créer une commande depuis le panier (vide le panier automatiquement)
- `createOrderManual` - Créer une commande manuellement sans panier
- `getMyOrders` - Mes commandes avec pagination et filtres par statut
- `getOrderById` - Détails d'une commande (seulement ses propres commandes)
- `cancelOrder` - Annuler une commande (pas si déjà livrée/annulée)

#### **Restaurant Admin** - Routes pour les restaurant_admin
**Permissions :** Authentification + rôle `restaurant_admin`

- `getOrderById` - Voir une commande de son restaurant
- `updateOrderStatus` - Mettre à jour le statut d'une commande de son restaurant

#### **Delivery Partner** - Routes pour les delivery_partner
**Permissions :** Authentification + rôle `delivery_partner`

- `getAvailableOrders` - Commandes disponibles pour assignation (statut Préparée, non assignées)
- `getMyAssignedOrders` - Mes commandes assignées (statuts Préparée ou En livraison)
- `assignOrderToMe` - S'assigner une commande (statut Préparée requis)
- `getOrderById` - Voir une commande assignée
- `updateOrderStatus` - Mettre à jour vers 'En livraison' ou 'Livrée' (commandes assignées seulement)

**Statuts valides :**
- `En attente` - Commande créée, en attente de confirmation
- `Confirmée` - Commande confirmée par le restaurant
- `Préparée` - Commande prête pour la livraison
- `En livraison` - Commande en cours de livraison
- `Livrée` - Commande livrée
- `Annulée` - Commande annulée

### 8. **Tracking** - Suivi des commandes
**Permissions :** Authentification requise

- `getOrderTracking` - Suivi d'une commande (client peut suivre seulement ses commandes)

## 🔄 Workflows de test recommandés

### Workflow Client
1. `Auth > signUp` (rôle: `client`)
2. `Auth > signIn`
3. `Restaurants > getRestaurants` - Voir les restaurants
4. `Restaurants > getRestaurantById` - Voir les détails
5. `Menus > getMenuItems` - Voir le menu d'un restaurant
6. `Cart > addToCart` - Ajouter des items au panier
7. `Cart > getCart` - Vérifier le panier
8. `Cart > validateCart` - Valider le panier
9. `Orders > Client > createOrderFromCart` - Créer la commande
10. `Orders > Client > getMyOrders` - Voir mes commandes
11. `Orders > Client > getOrderById` - Voir les détails
12. `Tracking > getOrderTracking` - Suivre la commande
13. `Restaurants > addRestaurantReview` - Ajouter un avis après livraison

### Workflow Restaurant Admin
1. `Auth > signUp` (rôle: `client` - ne peut pas créer restaurant_admin publiquement)
2. `Admin > createRestaurantWithAdmin` (nécessite token platform_admin) - Créer restaurant + admin
3. `Auth > signIn` avec les identifiants de l'admin créé
4. `Restaurants > createRestaurant` - Créer d'autres restaurants (un admin peut en avoir plusieurs)
5. `Restaurants > getMyRestaurants` - Voir mes restaurants
6. `Menus > addMenuItemToRestaurant` - Ajouter des items au menu
7. `Menus > updateMenuItem` - Modifier des items
8. `Orders > Restaurant Admin > getOrderById` - Voir les commandes
9. `Orders > Restaurant Admin > updateOrderStatus` - Mettre à jour les statuts

### Workflow Delivery Partner
1. `Auth > signUp` (rôle: `delivery_partner`)
2. `Auth > signIn`
3. `Orders > Delivery Partner > getAvailableOrders` - Voir les commandes disponibles
4. `Orders > Delivery Partner > assignOrderToMe` - S'assigner une commande
5. `Orders > Delivery Partner > getMyAssignedOrders` - Voir mes commandes assignées
6. `Orders > Delivery Partner > updateOrderStatus` - Mettre à jour vers 'En livraison'
7. `Orders > Delivery Partner > updateOrderStatus` - Mettre à jour vers 'Livrée'

### Workflow Platform Admin
1. Se connecter avec un compte platform_admin (créé via seed ou manuellement)
2. `Admin > createRestaurantWithAdmin` - Créer des restaurants avec leurs admins
3. `Users > searchUsers` - Rechercher des utilisateurs
4. `Users > deleteUser` - Supprimer des utilisateurs
5. `Restaurants > deleteRestaurant` - Supprimer n'importe quel restaurant
6. `Orders > Restaurant Admin > updateOrderStatus` - Modifier les statuts de toutes les commandes

## 📋 Notes importantes

### Rôles et permissions
- **Inscription publique** : Seulement `client` et `delivery_partner`
- **restaurant_admin** : Créé uniquement via `Admin > createRestaurantWithAdmin` (platform_admin)
- **platform_admin** : Créé via seed ou manuellement en base de données

### Restrictions par rôle
- Les `platform_admin` ne peuvent **pas** ajouter de menus (seulement les `restaurant_admin`)
- Un utilisateur ne peut voir que son propre profil (sauf `platform_admin`)
- Un `restaurant_admin` peut créer **plusieurs restaurants**
- Tous les items du panier doivent être du **même restaurant**

### Statuts de commande
- Une commande doit être en statut `Préparée` pour être assignée à un livreur
- Un client ne peut annuler que si la commande n'est pas `Livrée` ou `Annulée`
- Les transitions de statut suivent un workflow spécifique

### Reviews
- Les reviews ont un `rating` entre 1 et 5 (obligatoire) et un `comment` (optionnel)
- Un client peut avoir une seule review par restaurant (mise à jour si déjà existante)
- La note moyenne du restaurant est recalculée automatiquement

## 🛠️ Configuration

### Modifier l'URL de base
1. Ouvrir la collection dans Postman
2. Onglet "Variables"
3. Modifier `{{baseUrl}}` (défaut: `http://localhost:3000`)

### Variables automatiques
Les scripts de test (Tests tab) sauvegardent automatiquement :
- `{{token}}` après `signIn`
- `{{restaurantId}}` après création de restaurant
- `{{menuItemId}}` après création d'item de menu
- `{{orderId}}` après création de commande

## 🐛 Dépannage

### Le token n'est pas sauvegardé
- Vérifier que la requête `signIn` a bien réussi (status 200)
- Vérifier la console Postman pour les erreurs de script
- Le token devrait apparaître dans les variables de collection après un `signIn` réussi

### Erreur 403 (Forbidden)
- Vérifier que le token est valide
- Vérifier que l'utilisateur a le bon rôle pour l'action
- Certaines actions nécessitent des permissions spécifiques (voir la documentation des routes)

### Erreur 401 (Unauthorized)
- Vérifier que le token est présent dans les variables
- Essayer de se reconnecter avec `signIn`
- Vérifier que le token n'a pas expiré

### Variables non mises à jour
- Les scripts de test ne s'exécutent que si la requête réussit (status 2xx)
- Vérifier que la réponse contient bien les données attendues (format JSON)
- Vérifier la console Postman pour les erreurs de script
