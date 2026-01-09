# Architecture FoufouFood Android App

## 📐 Vue d'ensemble

Cette application Android suit l'**architecture Clean Architecture** recommandée par Google, avec les meilleures pratiques modernes d'Android.

## 🏗️ Structure du projet

```
com.example.foufoufood4/
├── data/                    # Couche de données
│   ├── common/
│   │   └── Resource.kt     # Wrapper pour la gestion des états (Success, Error, Loading)
│   ├── local/
│   │   └── SessionManager.kt  # Gestion des sessions utilisateur
│   ├── model/              # Modèles de données (DTOs)
│   │   ├── Restaurant.kt
│   │   ├── Menu.kt
│   │   ├── AuthResponse.kt
│   │   ├── SignUpRequest.kt
│   │   └── SignInRequest.kt
│   ├── remote/             # Accès au réseau
│   │   └── ApiService.kt   # Interface Retrofit
│   └── repository/         # Implémentations des repositories
│       ├── RestaurantRepository.kt
│       └── AuthRepository.kt
│
├── di/                     # Injection de dépendances (Hilt)
│   ├── NetworkModule.kt    # Module pour Retrofit et ApiService
│   ├── AppModule.kt        # Module pour SessionManager
│   └── RepositoryModule.kt # Module pour les Repositories
│
├── domain/                 # Couche métier
│   └── usecase/           # Cas d'utilisation (logique métier)
│       ├── GetRestaurantsUseCase.kt
│       ├── GetRestaurantMenuUseCase.kt
│       ├── SignUpUseCase.kt
│       └── SignInUseCase.kt
│
└── ui/                    # Couche de présentation
    ├── activity/          # Activities (points d'entrée)
    │   ├── MainActivity.kt
    │   ├── SignUpActivity.kt
    │   ├── SignInActivity.kt
    │   ├── RestaurantListActivity.kt
    │   └── RestaurantDetailActivity.kt
    ├── screens/           # Composables Screens
    │   ├── auth/
    │   │   ├── SignUpScreen.kt
    │   │   └── SignInScreen.kt
    │   └── restaurant/
    │       ├── RestaurantListScreen.kt
    │       └── RestaurantDetailScreen.kt
    ├── viewmodel/         # ViewModels (gestion d'état)
    │   ├── RestaurantListViewModel.kt
    │   ├── RestaurantDetailViewModel.kt
    │   ├── SignUpViewModel.kt
    │   └── SignInViewModel.kt
    └── theme/             # Thème de l'application
        ├── Color.kt
        ├── Theme.kt
        └── Type.kt
```

## 🔄 Flux de données

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

## 🛠️ Technologies utilisées

### Core
- **Kotlin** - Langage principal
- **Jetpack Compose** - UI déclarative moderne
- **Kotlin Coroutines** - Programmation asynchrone
- **StateFlow** - Gestion d'état réactive

### Architecture Components
- **ViewModel** - Gestion du cycle de vie et de l'état
- **Hilt** - Injection de dépendances
- **Navigation Compose** - Navigation (à implémenter)

### Networking
- **Retrofit** - Client HTTP
- **Gson** - Sérialisation JSON

### Storage
- **SharedPreferences** - Stockage local (via SessionManager)

## 📦 Modules et responsabilités

### 1. Data Layer (`data/`)

#### Responsabilités:
- Gestion des sources de données (API, base de données, cache)
- Transformation des données brutes en modèles utilisables
- Implémentation concrète des repositories

#### Composants clés:
- **Resource**: Wrapper générique pour encapsuler les résultats (Success, Error, Loading)
- **Repositories**: Interfaces et implémentations pour accéder aux données
- **ApiService**: Définition des endpoints API avec Retrofit
- **SessionManager**: Gestion de l'authentification et du token

### 2. Domain Layer (`domain/`)

#### Responsabilités:
- Contient la logique métier pure
- Définit les cas d'utilisation de l'application
- Indépendant des frameworks Android

#### Use Cases:
- **GetRestaurantsUseCase**: Récupère et filtre les restaurants
- **GetRestaurantMenuUseCase**: Récupère le menu d'un restaurant
- **SignUpUseCase**: Gère l'inscription avec validation
- **SignInUseCase**: Gère la connexion avec validation

### 3. Presentation Layer (`ui/`)

#### Responsabilités:
- Affichage de l'interface utilisateur
- Gestion des interactions utilisateur
- Observation des états depuis les ViewModels

#### Composants:
- **Activities**: Points d'entrée avec `@AndroidEntryPoint`
- **Screens (Composables)**: UI déclarative avec Compose
- **ViewModels**: Gestion d'état avec `@HiltViewModel`

### 4. Dependency Injection (`di/`)

#### Responsabilités:
- Configuration de l'injection de dépendances avec Hilt
- Fourniture des instances de classes

#### Modules:
- **NetworkModule**: Fournit Retrofit et ApiService
- **AppModule**: Fournit SessionManager et autres singletons
- **RepositoryModule**: Fournit les repositories

## 🔑 Principes appliqués

### SOLID
- ✅ **Single Responsibility**: Chaque classe a une responsabilité unique
- ✅ **Open/Closed**: Extensible via interfaces et abstractions
- ✅ **Liskov Substitution**: Les implémentations respectent leurs contrats
- ✅ **Interface Segregation**: Interfaces spécifiques et ciblées
- ✅ **Dependency Inversion**: Dépendances sur abstractions, pas implémentations

### Clean Architecture
- ✅ Séparation en couches (Data, Domain, Presentation)
- ✅ Indépendance des frameworks
- ✅ Testabilité
- ✅ Indépendance de l'UI

### Android Best Practices
- ✅ Single Activity Architecture
- ✅ Jetpack Compose pour l'UI
- ✅ ViewModel pour la survie aux changements de configuration
- ✅ StateFlow pour la gestion d'état réactive
- ✅ Hilt pour l'injection de dépendances
- ✅ Repository Pattern
- ✅ Use Cases pour la logique métier

## 📊 Gestion d'état

### Resource Pattern
```kotlin
sealed class Resource<out T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val message: String, val exception: Throwable? = null) : Resource<Nothing>()
    object Loading : Resource<Nothing>()
}
```

### StateFlow dans ViewModels
```kotlin
private val _uiState = MutableStateFlow(RestaurantListState())
val uiState: StateFlow<RestaurantListState> = _uiState.asStateFlow()
```

### Observation dans Compose
```kotlin
val uiState by viewModel.uiState.collectAsState()
```

## 🧪 Tests (à implémenter)

### Tests unitaires recommandés:
- **ViewModels**: Test de la logique de transformation d'état
- **Use Cases**: Test de la logique métier
- **Repositories**: Test avec des mocks d'API

### Tests d'intégration:
- **UI Tests**: Tests Compose avec `ComposeTestRule`
- **Navigation**: Vérification des flux de navigation

## 🚀 Améliorations futures

### Court terme:
- [ ] Ajouter Navigation Compose
- [ ] Implémenter Room Database pour le cache offline
- [ ] Ajouter des tests unitaires
- [ ] Implémenter la pagination pour les listes

### Long terme:
- [ ] Ajouter WorkManager pour les tâches en arrière-plan
- [ ] Implémenter DataStore au lieu de SharedPreferences
- [ ] Ajouter des analytics (Firebase Analytics)
- [ ] Implémenter le mode sombre
- [ ] Ajouter le support multilingue

## 📝 Conventions de code

### Naming:
- **Classes**: PascalCase (ex: `RestaurantRepository`)
- **Functions**: camelCase (ex: `fetchRestaurants()`)
- **Variables**: camelCase (ex: `restaurantList`)
- **Constants**: UPPER_SNAKE_CASE (ex: `BASE_URL`)

### Packages:
- Utiliser des noms courts et descriptifs
- Grouper par fonctionnalité, pas par type de fichier

### Composables:
- Noms au présent (ex: `RestaurantCard`, pas `RestaurantCardComposable`)
- Fonctions de prévisualisation avec `@Preview`

## 🔐 Sécurité

### Bonnes pratiques appliquées:
- ✅ Token stocké en SharedPreferences (mode privé)
- ✅ Pas de données sensibles en logs
- ✅ HTTPS pour toutes les communications réseau
- ✅ Validation côté client pour les formulaires

### À améliorer:
- [ ] Chiffrement du token avec EncryptedSharedPreferences
- [ ] Certificate pinning pour les requêtes réseau
- [ ] Obfuscation du code avec ProGuard/R8

## 📱 Support des versions

- **minSdk**: 24 (Android 7.0 Nougat)
- **targetSdk**: 36 (Android 14+)
- **compileSdk**: 36

## 📖 Ressources

- [Guide Architecture Android](https://developer.android.com/topic/architecture)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Hilt Documentation](https://developer.android.com/training/dependency-injection/hilt-android)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

---

**Auteur**: FoufouFood Team  
**Dernière mise à jour**: Octobre 2024  
**Version de l'architecture**: 2.0 (Clean Architecture avec Compose)

