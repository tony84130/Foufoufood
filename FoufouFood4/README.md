# 🍕 FouFouFood Android - Application Mobile

Application Android de livraison de repas avec système de commandes complet, gestion du panier virtuel, attribution des livreurs et notifications en temps réel.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Vérification](#vérification)
- [Structure du Projet](#structure-du-projet)
- [Architecture](#architecture)
- [Technologies Utilisées](#technologies-utilisées)
- [Fonctionnalités](#fonctionnalités)
- [Utilisation](#utilisation)
- [Versions](#versions)

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé les éléments suivants :

### Logiciels requis

- **Android Studio** (version Hedgehog | 2023.1.1 ou supérieure)
  - Télécharger : [developer.android.com/studio](https://developer.android.com/studio)
  - Vérifier la version : `Help` → `About`
  
- **JDK** (Java Development Kit) - Version 17 ou supérieure
  - Généralement inclus avec Android Studio
  - Vérifier : `File` → `Project Structure` → `SDK Location` → `JDK Location`
  
- **Android SDK** (Software Development Kit)
  - Géré automatiquement par Android Studio
  - Vérifier : `Tools` → `SDK Manager`
  - Version minimale requise : **API 24** (Android 7.0 Nougat)
  - Version cible : **API 36** (Android 14+)

### Outils optionnels (recommandés)

- **Git** (pour cloner le projet)
- **Émulateur Android** ou **Appareil physique** pour tester l'application
- **Serveur FouFouFood** en cours d'exécution (voir [README du serveur](../README.md))

## 🚀 Installation

### Étape 1 : Cloner le projet

```bash
git clone <repository-url>
cd foufoufood-server/FoufouFood4
```

### Étape 2 : Ouvrir le projet dans Android Studio

1. Lancez **Android Studio**
2. Cliquez sur `Open` ou `File` → `Open`
3. Naviguez vers le dossier `FoufouFood4` et sélectionnez-le
4. Android Studio va automatiquement :
   - Synchroniser le projet avec Gradle
   - Télécharger les dépendances
   - Configurer le SDK Android

### Étape 3 : Synchroniser Gradle

Si la synchronisation ne se fait pas automatiquement :

1. Cliquez sur `File` → `Sync Project with Gradle Files`
2. Attendez que la synchronisation se termine (barre de progression en bas)
3. Vérifiez qu'il n'y a pas d'erreurs dans la fenêtre `Build`

**⚠️ Important :** La première synchronisation peut prendre plusieurs minutes car Android Studio télécharge toutes les dépendances.

## ⚙️ Configuration

### Configuration de l'URL du serveur

L'application doit être configurée pour se connecter au serveur FouFouFood. L'URL de base est définie dans `app/src/main/java/com/example/foufoufood4/di/NetworkModule.kt`.

#### Pour l'émulateur Android :

Par défaut, l'URL est configurée pour l'émulateur Android :
```kotlin
private const val BASE_URL = "http://10.0.2.2:3000/foufoufood/"
```

`10.0.2.2` est l'adresse spéciale qui pointe vers `localhost` de votre machine hôte depuis l'émulateur.

#### Pour un appareil physique :

Si vous testez sur un appareil physique, vous devez modifier l'URL pour pointer vers l'adresse IP de votre machine :

1. Trouvez l'adresse IP de votre machine :
   - **Windows** : `ipconfig` dans PowerShell/CMD
   - **Mac/Linux** : `ifconfig` ou `ip addr`
   - Cherchez l'adresse IPv4 (ex: `192.168.1.5`)

2. Modifiez `NetworkModule.kt` :
```kotlin
private const val BASE_URL = "http://192.168.1.5:3000/foufoufood/" // Remplacez par votre IP
```

3. Assurez-vous que votre appareil et votre ordinateur sont sur le **même réseau Wi-Fi**.

#### Configuration Socket.IO (Notifications)

L'URL Socket.IO pour les notifications en temps réel est définie dans `NotificationViewModel.kt` :

```kotlin
private const val SERVER_URL = "http://10.0.2.2:3000" // Pour émulateur
// ou
private const val SERVER_URL = "http://192.168.1.5:3000" // Pour appareil physique
```

**⚠️ Important :** Assurez-vous que les URLs correspondent à votre configuration (émulateur vs appareil physique).

### Permissions

L'application nécessite la permission `INTERNET` qui est déjà configurée dans `AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Le manifeste autorise également le trafic HTTP en clair (`usesCleartextTraffic="true"`) pour le développement local.

## ▶️ Démarrage

### Étape 1 : Démarrer le serveur

Avant de lancer l'application Android, assurez-vous que le serveur FouFouFood est démarré :

```bash
# Dans le dossier foufoufood-server
npm start
```

Le serveur doit être accessible sur `http://localhost:3000` (ou l'IP configurée dans l'app).

### Étape 2 : Configurer un émulateur ou connecter un appareil

#### Utiliser un émulateur Android

1. Dans Android Studio, cliquez sur `Tools` → `Device Manager`
2. Cliquez sur `Create Device`
3. Sélectionnez un appareil (ex: Pixel 5)
4. Sélectionnez une image système (API 24 ou supérieure)
5. Cliquez sur `Finish`

### Étape 3 : Lancer l'application

1. Dans Android Studio, sélectionnez votre émulateur/appareil dans le menu déroulant en haut
2. Cliquez sur le bouton **Run** (▶️) ou appuyez sur `Shift + F10`
3. L'application va compiler et s'installer sur votre appareil/émulateur

**Ce qui se passe au démarrage :**
1. ✅ Compilation du code Kotlin
2. ✅ Génération de l'APK (Android Package)
3. ✅ Installation sur l'appareil/émulateur
4. ✅ Lancement de l'application
5. ✅ Affichage de l'écran d'accueil (`WelcomeActivity`)

## ✅ Vérification

### Vérifier que l'application fonctionne

1. **Test de connexion au serveur :**
   - Connectez-vous ou créez un compte
   - Si vous voyez les restaurants, la connexion fonctionne ✅

2. **Test des notifications :**
   - Créez une commande en tant que client
   - Vérifiez que les notifications arrivent en temps réel

3. **Vérifier les logs :**
   - Dans Android Studio, ouvrez l'onglet `Logcat`
   - Filtrez par `FouFouFood` ou votre tag de log
   - Les requêtes HTTP sont loggées grâce à `HttpLoggingInterceptor`

## 📁 Structure du Projet

```
FoufouFood4/
├── 📁 app/
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/example/foufoufood4/
│   │   │   │   ├── 📁 data/                    # Couche de données
│   │   │   │   │   ├── 📁 common/
│   │   │   │   │   │   └── Resource.kt         # Wrapper pour les états (Success, Error, Loading)
│   │   │   │   │   ├── 📁 local/
│   │   │   │   │   │   ├── SessionManager.kt   # Gestion des sessions utilisateur
│   │   │   │   │   │   └── PreferenceManager.kt
│   │   │   │   │   ├── 📁 model/               # Modèles de données (DTOs)
│   │   │   │   │   │   ├── Restaurant.kt
│   │   │   │   │   │   ├── Menu.kt
│   │   │   │   │   │   ├── Order.kt
│   │   │   │   │   │   ├── User.kt
│   │   │   │   │   │   ├── Address.kt
│   │   │   │   │   │   ├── CartItem.kt
│   │   │   │   │   │   ├── OpeningHours.kt
│   │   │   │   │   │   ├── OrderItemRequest.kt
│   │   │   │   │   │   ├── 📁 request/         # Requêtes API
│   │   │   │   │   │   │   ├── 📁 admin/
│   │   │   │   │   │   │   │   └── CreateRestaurantAdminRequest.kt
│   │   │   │   │   │   │   ├── 📁 auth/
│   │   │   │   │   │   │   │   ├── SignInRequest.kt
│   │   │   │   │   │   │   │   └── SignUpRequest.kt
│   │   │   │   │   │   │   ├── 📁 menu/
│   │   │   │   │   │   │   │   ├── AddMenuItemRequest.kt
│   │   │   │   │   │   │   │   └── UpdateMenuItemRequest.kt
│   │   │   │   │   │   │   ├── 📁 restaurant/
│   │   │   │   │   │   │   │   ├── AddReviewRequest.kt
│   │   │   │   │   │   │   │   ├── CreateRestaurantRequest.kt
│   │   │   │   │   │   │   │   └── UpdateRestaurantRequest.kt
│   │   │   │   │   │   │   └── 📁 user/
│   │   │   │   │   │   │       └── UpdateUserRequest.kt
│   │   │   │   │   │   └── 📁 response/         # Réponses API
│   │   │   │   │   │       ├── ApiListResponse.kt
│   │   │   │   │   │       ├── AuthResponse.kt
│   │   │   │   │   │       ├── CreateRestaurantAdminResponse.kt
│   │   │   │   │   │       ├── MenuResponse.kt
│   │   │   │   │   │       ├── OrderResponse.kt
│   │   │   │   │   │       ├── OrdersListResponse.kt
│   │   │   │   │   │       ├── PendingNotificationResponse.kt
│   │   │   │   │   │       ├── RestaurantResponse.kt
│   │   │   │   │   │       ├── SimpleApiResponse.kt
│   │   │   │   │   │       ├── UserResponse.kt
│   │   │   │   │   │       └── UsersListResponse.kt
│   │   │   │   │   ├── 📁 remote/
│   │   │   │   │   │   └── ApiService.kt        # Interface Retrofit
│   │   │   │   │   └── 📁 repository/           # Implémentations des repositories
│   │   │   │   │       ├── AuthRepository.kt
│   │   │   │   │       ├── RestaurantRepository.kt
│   │   │   │   │       ├── MenuRepository.kt
│   │   │   │   │       ├── CartRepository.kt
│   │   │   │   │       ├── OrderRepository.kt
│   │   │   │   │       ├── UserRepository.kt
│   │   │   │   │       └── AdminRepository.kt
│   │   │   │   ├── 📁 di/                       # Injection de dépendances (Hilt)
│   │   │   │   │   ├── NetworkModule.kt         # Configuration Retrofit et ApiService
│   │   │   │   │   ├── AppModule.kt             # SessionManager et autres singletons
│   │   │   │   │   └── RepositoryModule.kt       # Repositories
│   │   │   │   ├── 📁 domain/                   # Couche métier
│   │   │   │   │   └── 📁 usecase/              # Cas d'utilisation (logique métier)
│   │   │   │   │       ├── CheckPendingNotificationsUseCase.kt
│   │   │   │   │       ├── ClearPendingNotificationsUseCase.kt
│   │   │   │   │       ├── 📁 admin/
│   │   │   │   │       │   └── CreateRestaurantAdminUseCase.kt
│   │   │   │   │       ├── 📁 auth/
│   │   │   │   │       │   ├── SignInUseCase.kt
│   │   │   │   │       │   ├── SignOutUseCase.kt
│   │   │   │   │       │   └── SignUpUseCase.kt
│   │   │   │   │       ├── 📁 menu/
│   │   │   │   │       │   ├── AddMenuItemUseCase.kt
│   │   │   │   │       │   ├── DeleteMenuItemUseCase.kt
│   │   │   │   │       │   └── UpdateMenuItemUseCase.kt
│   │   │   │   │       ├── 📁 restaurant/
│   │   │   │   │       │   ├── AddRestaurantReviewUseCase.kt
│   │   │   │   │       │   ├── CreateRestaurantUseCase.kt
│   │   │   │   │       │   ├── DeleteRestaurantReviewUseCase.kt
│   │   │   │   │       │   ├── DeleteRestaurantUseCase.kt
│   │   │   │   │       │   ├── GetMyRestaurantsUseCase.kt
│   │   │   │   │       │   ├── GetRestaurantByIdUseCase.kt
│   │   │   │   │       │   ├── GetRestaurantMenuUseCase.kt
│   │   │   │   │       │   ├── GetRestaurantsUseCase.kt
│   │   │   │   │       │   └── UpdateRestaurantUseCase.kt
│   │   │   │   │       └── 📁 user/
│   │   │   │   │           ├── DeleteCurrentUserUseCase.kt
│   │   │   │   │           ├── DeleteUserUseCase.kt
│   │   │   │   │           ├── GetAllUsersUseCase.kt
│   │   │   │   │           ├── GetCurrentUserUseCase.kt
│   │   │   │   │           └── UpdateUserProfileUseCase.kt
│   │   │   │   ├── 📁 ui/                       # Couche de présentation
│   │   │   │   │   ├── 📁 activity/             # Activities (points d'entrée)
│   │   │   │   │   │   ├── MainActivity.kt
│   │   │   │   │   │   ├── 📁 auth/
│   │   │   │   │   │   │   ├── WelcomeActivity.kt
│   │   │   │   │   │   │   ├── SignInActivity.kt
│   │   │   │   │   │   │   ├── SignUpActivity.kt
│   │   │   │   │   │   │   ├── ClientSignUpActivity.kt
│   │   │   │   │   │   │   └── DeliveryPartnerSignUpActivity.kt
│   │   │   │   │   │   ├── 📁 restaurant/
│   │   │   │   │   │   │   ├── RestaurantListActivity.kt
│   │   │   │   │   │   │   └── RestaurantDetailActivity.kt
│   │   │   │   │   │   ├── 📁 cart/
│   │   │   │   │   │   │   └── CartActivity.kt
│   │   │   │   │   │   ├── 📁 order/
│   │   │   │   │   │   │   ├── CheckoutActivity.kt
│   │   │   │   │   │   │   ├── OrderListActivity.kt
│   │   │   │   │   │   │   ├── OrderDetailActivity.kt
│   │   │   │   │   │   │   └── OrderSuccessActivity.kt
│   │   │   │   │   │   ├── 📁 admin/
│   │   │   │   │   │   │   └── AdminDashboardActivity.kt
│   │   │   │   │   │   ├── 📁 delivery/
│   │   │   │   │   │   │   └── DeliveryDashboardActivity.kt
│   │   │   │   │   │   ├── 📁 profile/
│   │   │   │   │   │   │   └── ProfileActivity.kt
│   │   │   │   │   │   └── 📁 favorites/
│   │   │   │   │   │       └── FavoritesActivity.kt
│   │   │   │   │   ├── 📁 screens/              # Composables Screens (Jetpack Compose)
│   │   │   │   │   │   ├── 📁 admin/
│   │   │   │   │   │   │   ├── AdminDashboardScreen.kt
│   │   │   │   │   │   │   ├── CreateRestaurantAdminTab.kt
│   │   │   │   │   │   │   ├── RestaurantsListTab.kt
│   │   │   │   │   │   │   └── UsersListTab.kt
│   │   │   │   │   │   ├── 📁 auth/
│   │   │   │   │   │   │   ├── ClientSignUpScreen.kt
│   │   │   │   │   │   │   ├── DeliveryPartnerSignUpScreen.kt
│   │   │   │   │   │   │   ├── SignInScreen.kt
│   │   │   │   │   │   │   ├── SignUpScreen.kt
│   │   │   │   │   │   │   └── WelcomeScreen.kt
│   │   │   │   │   │   ├── 📁 cart/
│   │   │   │   │   │   │   └── CartScreen.kt
│   │   │   │   │   │   ├── 📁 delivery/
│   │   │   │   │   │   │   └── DeliveryDashboardScreen.kt
│   │   │   │   │   │   ├── 📁 favorites/
│   │   │   │   │   │   │   └── FavoritesScreen.kt
│   │   │   │   │   │   ├── 📁 order/
│   │   │   │   │   │   │   ├── CheckoutScreen.kt
│   │   │   │   │   │   │   ├── OrderDetailScreen.kt
│   │   │   │   │   │   │   ├── OrderListScreen.kt
│   │   │   │   │   │   │   └── OrderSuccessScreen.kt
│   │   │   │   │   │   ├── 📁 profile/
│   │   │   │   │   │   │   ├── ProfileEditScreen.kt
│   │   │   │   │   │   │   └── ProfileScreen.kt
│   │   │   │   │   │   └── 📁 restaurant/
│   │   │   │   │   │       ├── RestaurantDetailScreen.kt
│   │   │   │   │   │       └── RestaurantListScreen.kt
│   │   │   │   │   ├── 📁 viewmodel/            # ViewModels (gestion d'état)
│   │   │   │   │   │   ├── 📁 admin/
│   │   │   │   │   │   │   └── AdminViewModel.kt
│   │   │   │   │   │   ├── 📁 auth/
│   │   │   │   │   │   │   ├── SignInViewModel.kt
│   │   │   │   │   │   │   └── SignUpViewModel.kt
│   │   │   │   │   │   ├── 📁 cart/
│   │   │   │   │   │   │   └── CartViewModel.kt
│   │   │   │   │   │   ├── 📁 delivery/
│   │   │   │   │   │   │   └── DeliveryViewModel.kt
│   │   │   │   │   │   ├── 📁 favorites/
│   │   │   │   │   │   │   └── FavoritesViewModel.kt
│   │   │   │   │   │   ├── 📁 notifications/
│   │   │   │   │   │   │   └── NotificationViewModel.kt
│   │   │   │   │   │   ├── 📁 order/
│   │   │   │   │   │   │   ├── CheckoutViewModel.kt
│   │   │   │   │   │   │   ├── OrderDetailViewModel.kt
│   │   │   │   │   │   │   └── OrderListViewModel.kt
│   │   │   │   │   │   ├── 📁 profile/
│   │   │   │   │   │   │   └── ProfileViewModel.kt
│   │   │   │   │   │   └── 📁 restaurant/
│   │   │   │   │   │       ├── RestaurantDetailViewModel.kt
│   │   │   │   │   │       ├── RestaurantListViewModel.kt
│   │   │   │   │   │       ├── RestaurantManagementViewModel.kt
│   │   │   │   │   │       └── RestaurantSortOption.kt
│   │   │   │   │   ├── 📁 components/           # Composants réutilisables
│   │   │   │   │   │   └── StatusChip.kt
│   │   │   │   │   └── 📁 theme/                # Thème de l'application
│   │   │   │   │       ├── Color.kt
│   │   │   │   │       ├── Theme.kt
│   │   │   │   │       └── Type.kt
│   │   │   │   └── FoufouFoodApplication.kt     # Application class
│   │   │   ├── 📁 res/                          # Ressources (images, layouts, strings)
│   │   │   └── AndroidManifest.xml
│   │   ├── 📁 test/                              # Tests unitaires
│   │   └── 📁 androidTest/                      # Tests d'intégration
│   ├── build.gradle.kts                         # Configuration du module app
│   └── proguard-rules.pro                       # Règles ProGuard
├── 📁 gradle/
│   ├── libs.versions.toml                       # Gestion des versions de dépendances
│   └── 📁 wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── build.gradle.kts                             # Configuration du projet racine
├── settings.gradle.kts                          # Configuration des modules
├── gradle.properties                            # Propriétés Gradle
├── gradlew                                      # Script Gradle (Unix/Mac)
├── gradlew.bat                                  # Script Gradle (Windows)
├── local.properties                             # Propriétés locales (ignoré par Git)
├── ARCHITECTURE.md                              # Documentation détaillée de l'architecture
└── README.md                                    # Ce fichier
```

## 🏗️ Architecture

L'application suit l'**Architecture Clean Architecture** recommandée par Google, avec séparation en trois couches principales :

### 1. **Data Layer** (`data/`)
- **Responsabilités** : Gestion des sources de données (API, cache local)
- **Composants** :
  - `Repository` : Implémentations concrètes pour accéder aux données
  - `ApiService` : Interface Retrofit définissant les endpoints
  - `SessionManager` : Gestion de l'authentification et du token JWT
  - `Model` : DTOs (Data Transfer Objects) pour la sérialisation JSON

### 2. **Domain Layer** (`domain/`)
- **Responsabilités** : Logique métier pure, indépendante des frameworks
- **Composants** :
  - `UseCase` : Cas d'utilisation encapsulant la logique métier
  - Exemples : `SignInUseCase`, `GetRestaurantsUseCase`, `CreateOrderUseCase`

### 3. **Presentation Layer** (`ui/`)
- **Responsabilités** : Interface utilisateur et gestion d'état
- **Composants** :
  - `Activity` : Points d'entrée de l'application
  - `Screen` : Composables Jetpack Compose pour l'UI
  - `ViewModel` : Gestion d'état avec StateFlow
  - `Theme` : Thème Material Design 3

### Flux de données

```
UI Layer (Compose)
    ↕️
ViewModel (StateFlow)
    ↕️
UseCase (Business Logic)
    ↕️
Repository (Data Source)
    ↕️
Remote Data Source (Retrofit) / Local Data Source (SharedPreferences)
```

Pour plus de détails sur l'architecture, consultez [ARCHITECTURE.md](ARCHITECTURE.md).

## 🛠️ Technologies Utilisées

### Core
- **Kotlin** - Langage principal de développement
- **Jetpack Compose** - Framework UI déclaratif moderne
- **Kotlin Coroutines** - Programmation asynchrone
- **StateFlow** - Gestion d'état réactive

### Architecture Components
- **ViewModel** - Gestion du cycle de vie et de l'état
- **Hilt** - Injection de dépendances
- **Lifecycle** - Gestion du cycle de vie des composants

### Networking
- **Retrofit** - Client HTTP pour les appels API REST
- **Gson** - Sérialisation/désérialisation JSON
- **OkHttp** - Client HTTP sous-jacent avec intercepteurs
- **Socket.IO Client** - Notifications en temps réel

### UI & Design
- **Material Design 3** - Système de design Material
- **Coil** - Chargement d'images asynchrone
- **Compose Icons Extended** - Icônes Material

### Storage
- **SharedPreferences** - Stockage local (via `SessionManager`)

## 🎯 Fonctionnalités

### ✅ Fonctionnalités Implémentées

#### 🔐 Authentification et Sécurité
- Inscription et connexion pour tous les rôles
- Gestion des sessions avec JWT
- Stockage sécurisé du token dans SharedPreferences
- 4 rôles utilisateurs : `client`, `delivery_partner`, `restaurant_admin`, `platform_admin`
- Navigation automatique selon le rôle après connexion

#### 👥 Gestion des Utilisateurs
- Inscription et connexion
- Gestion du profil utilisateur (consultation, modification, suppression)
- Gestion des adresses de livraison
- Pré-remplissage des champs d'adresse lors du checkout

#### 🏪 Gestion des Restaurants
- Consultation publique des restaurants
- Affichage des détails d'un restaurant
- Système de notation et d'avis par les clients
- Affichage des notes moyennes et des avis
- Consultation des avis par les `restaurant_admin` (lecture seule)

#### 🍽️ Gestion des Menus
- Consultation publique des menus
- Affichage des catégories et des plats
- CRUD complet pour les `restaurant_admin` (ajout, modification, suppression)

#### 🛒 Panier Virtuel
- Ajout d'articles au panier
- Modification des quantités
- Suppression d'articles
- Calcul automatique du total
- Validation du panier avant commande

#### 📋 Système de Commandes
- Création de commandes depuis le panier
- Suivi des statuts : `En attente`, `Confirmée`, `Préparée`, `En livraison`, `Livrée`, `Annulée`
- Visualisation des commandes par rôle
- Gestion des permissions par rôle :
  - `client` : Créer, consulter, annuler ses commandes
  - `restaurant_admin` : Confirmer et préparer les commandes
  - `delivery_partner` : S'assigner et livrer les commandes
  - `platform_admin` : Voir toutes les commandes

#### 🚚 Gestion des Livreurs
- Visualisation des commandes disponibles pour les livreurs
- Attribution manuelle des commandes aux livreurs
- Mise à jour du statut de livraison
- Affichage du nom du livreur dans les détails de commande

#### 🔔 Notifications
- Notifications en temps réel via Socket.IO
- Affichage des notifications dans l'application
- Historique des notifications

#### 👨‍💼 Administration
- Dashboard pour `platform_admin` :
  - Gestion des utilisateurs
  - Création de comptes `restaurant_admin`
  - Consultation des restaurants
- Dashboard pour `restaurant_admin` :
  - Gestion des restaurants (CRUD)
  - Gestion des menus (CRUD)
  - Consultation des commandes
  - Consultation des avis clients

#### 📱 Interface Utilisateur
- Interface moderne avec Jetpack Compose
- Material Design 3
- Navigation intuitive selon les rôles
- Gestion d'état réactive avec StateFlow
- Gestion des erreurs et états de chargement

## 📖 Utilisation

### Rôles et Fonctionnalités

#### 👤 Client (`client`)
- Explorer les restaurants
- Consulter les menus
- Ajouter des articles au panier
- Passer une commande
- Suivre ses commandes
- Noter et commenter les restaurants
- Gérer son profil et ses adresses

#### 🏪 Administrateur Restaurant (`restaurant_admin`)
- Gérer ses restaurants (créer, modifier, supprimer)
- Gérer les menus de ses restaurants
- Consulter les commandes de ses restaurants
- Confirmer et préparer les commandes
- Consulter les avis clients (lecture seule)

#### 🚚 Partenaire de Livraison (`delivery_partner`)
- Consulter les commandes disponibles
- S'assigner des commandes
- Mettre à jour le statut de livraison
- Consulter ses commandes assignées
- Gérer son profil

#### 👨‍💼 Administrateur Plateforme (`platform_admin`)
- Gérer tous les utilisateurs
- Créer des comptes `restaurant_admin`
- Consulter tous les restaurants
- Consulter toutes les commandes
- Gérer son profil

### Workflow de Commande

1. **Client** :
   - Explorer les restaurants → Voir le menu → Ajouter au panier → Valider le panier → Passer commande

2. **Restaurant** :
   - Recevoir notification → Confirmer la commande → Préparer la commande

3. **Livreur** :
   - Voir les commandes disponibles → S'assigner une commande → Récupérer la commande → Marquer comme livrée

4. **Client** :
   - Suivre le statut en temps réel → Recevoir la commande → Noter le restaurant

## 📊 Versions

- **minSdk** : 24 (Android 7.0 Nougat)
- **targetSdk** : 36 (Android 14+)
- **compileSdk** : 36
- **Kotlin** : 2.1.10
- **Compose BOM** : 2024.12.01
- **Hilt** : 2.53.1

---

**Auteur** : 

Théodore Grignard
Xavier Dostie
Sébastien Drezet
Tony Besse

