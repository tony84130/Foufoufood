package com.example.foufoufood4.ui.viewmodel.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.response.CreateRestaurantAdminResponse
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.data.repository.RestaurantRepository
import com.example.foufoufood4.data.repository.UserRepository
import com.example.foufoufood4.domain.usecase.admin.CreateRestaurantAdminUseCase
import com.example.foufoufood4.domain.usecase.user.DeleteUserUseCase
import com.example.foufoufood4.domain.usecase.user.GetAllUsersUseCase
import com.example.foufoufood4.domain.usecase.user.GetCurrentUserUseCase
import com.example.foufoufood4.domain.usecase.restaurant.GetMyRestaurantsUseCase
import com.example.foufoufood4.domain.usecase.restaurant.GetRestaurantsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import javax.inject.Inject

/**
 * État de l'interface utilisateur pour le dashboard admin.
 */
data class AdminState(
    val users: List<User> = emptyList(),
    val restaurants: List<Restaurant> = emptyList(),
    val allUsers: List<User> = emptyList(), // Tous les utilisateurs (pour la recherche locale)
    val allRestaurants: List<Restaurant> = emptyList(), // Tous les restaurants (pour la recherche locale)
    val userSearchQuery: String = "", // Requête de recherche utilisateurs
    val restaurantSearchQuery: String = "", // Requête de recherche restaurants
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val selectedTab: Int = 0, // 0: Users/Restaurants, 1: Restaurants/Menus, 2: Create
    val showDeleteConfirmation: Boolean = false,
    val userToDelete: User? = null,
    val userRoleFilter: String? = null, // null = tous, "client", "delivery_partner", "restaurant_admin"
    val currentUserRole: String? = null // Role de l'utilisateur actuel (pour adapter l'UI)
)

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val getAllUsersUseCase: GetAllUsersUseCase,
    private val getRestaurantsUseCase: GetRestaurantsUseCase,
    private val getMyRestaurantsUseCase: GetMyRestaurantsUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val deleteUserUseCase: DeleteUserUseCase,
    private val createRestaurantAdminUseCase: CreateRestaurantAdminUseCase,
    private val restaurantRepository: RestaurantRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminState())
    val uiState: StateFlow<AdminState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    /**
     * Charge toutes les données (users + restaurants).
     */
    fun loadData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            // Récupérer l'utilisateur actuel pour déterminer son rôle
            val currentUserResult = getCurrentUserUseCase()
            
            if (currentUserResult is Resource.Error) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Erreur : ${currentUserResult.message}"
                )
                return@launch
            }
            
            val currentUser = (currentUserResult as Resource.Success).data
            val userRole = currentUser.role

            // Charger les données selon le rôle
            val usersResult = if (userRole == "platform_admin") {
                // Les platform_admin voient tous les utilisateurs
                getAllUsersUseCase()
            } else {
                // Les restaurant_admin ne voient pas la liste des utilisateurs
                Resource.Success(emptyList())
            }
            
            // Charger les restaurants selon le rôle
            val restaurantsResult = if (userRole == "platform_admin") {
                // Les platform_admin voient tous les restaurants
                getRestaurantsUseCase()
            } else if (userRole == "restaurant_admin") {
                // Les restaurant_admin ne voient que leurs restaurants
                getMyRestaurantsUseCase()
            } else {
                Resource.Success(emptyList())
            }

            val newState = when {
                usersResult is Resource.Error -> {
                    _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Erreur chargement utilisateurs: ${usersResult.message}"
                    )
                }
                restaurantsResult is Resource.Error -> {
                    _uiState.value.copy(
                        isLoading = false,
                        users = (usersResult as? Resource.Success)?.data ?: emptyList(),
                        errorMessage = "Erreur chargement restaurants: ${restaurantsResult.message}"
                    )
                }
                usersResult is Resource.Success && restaurantsResult is Resource.Success -> {
                    _uiState.value.copy(
                        isLoading = false,
                        users = usersResult.data,
                        restaurants = restaurantsResult.data,
                        allUsers = usersResult.data, // Sauvegarder tous les utilisateurs
                        allRestaurants = restaurantsResult.data, // Sauvegarder tous les restaurants
                        errorMessage = null,
                        currentUserRole = userRole
                    )
                }
                else -> {
                    _uiState.value.copy(
                        isLoading = false,
                        errorMessage = "Erreur inattendue lors du chargement"
                    )
                }
            }

            _uiState.value = newState
        }
    }

    /**
     * Change l'onglet sélectionné.
     */
    fun selectTab(tabIndex: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = tabIndex, errorMessage = null, successMessage = null)
    }

    /**
     * Affiche la confirmation de suppression.
     */
    fun showDeleteConfirmation(user: User) {
        _uiState.value = _uiState.value.copy(
            showDeleteConfirmation = true,
            userToDelete = user
        )
    }

    /**
     * Cache la confirmation de suppression.
     */
    fun hideDeleteConfirmation() {
        _uiState.value = _uiState.value.copy(
            showDeleteConfirmation = false,
            userToDelete = null
        )
    }

    /**
     * Supprime un utilisateur.
     */
    fun deleteUser() {
        val userToDelete = _uiState.value.userToDelete ?: return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            when (val result = deleteUserUseCase(userToDelete.id)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Utilisateur supprimé avec succès",
                        showDeleteConfirmation = false,
                        userToDelete = null
                    )
                    // Recharger les données
                    loadData()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = result.message,
                        showDeleteConfirmation = false,
                        userToDelete = null
                    )
                }
                is Resource.Loading -> {
                    // Déjà géré
                }
            }
        }
    }

    /**
     * Crée un restaurant avec son administrateur.
     */
    fun createRestaurantWithAdmin(
        restaurantName: String,
        restaurantAddress: String,
        adminName: String,
        adminEmail: String,
        adminPassword: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            // Normaliser l'email en minuscules
            val normalizedEmail = adminEmail.trim().lowercase()

            when (val result = createRestaurantAdminUseCase(
                restaurantName = restaurantName,
                restaurantAddress = restaurantAddress,
                adminName = adminName,
                adminEmail = normalizedEmail,
                adminPassword = adminPassword
            )) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Restaurant et administrateur créés avec succès !"
                    )
                    // Recharger les données
                    loadData()
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = result.message
                    )
                }
                is Resource.Loading -> {
                    // Déjà géré
                }
            }
        }
    }

    /**
     * Efface les messages de succès/erreur.
     */
    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }

    /**
     * Filtre les utilisateurs par rôle.
     */
    fun getUsersByRole(role: String): List<User> {
        return _uiState.value.users.filter { it.role == role }
    }

    /**
     * Définit le filtre de rôle pour les utilisateurs.
     * @param role Le rôle à filtrer, ou null pour afficher tous les utilisateurs
     */
    fun setUserRoleFilter(role: String?) {
        _uiState.value = _uiState.value.copy(userRoleFilter = role)
    }

    /**
     * Obtient les utilisateurs filtrés selon le rôle sélectionné.
     */
    fun getFilteredUsers(): List<User> {
        val filter = _uiState.value.userRoleFilter
        return if (filter == null) {
            _uiState.value.users
        } else {
            _uiState.value.users.filter { it.role == filter }
        }
    }

    /**
     * Recherche des restaurants (recherche locale avec debouncing).
     */
    fun searchRestaurants(query: String) {
        // Mettre à jour la requête de recherche immédiatement
        _uiState.value = _uiState.value.copy(restaurantSearchQuery = query)
        
        if (query.isBlank()) {
            // Si la requête est vide, afficher tous les restaurants
            _uiState.value = _uiState.value.copy(restaurants = _uiState.value.allRestaurants)
            return
        }

        // Recherche locale avec debouncing
        viewModelScope.launch {
            delay(300) // Attendre 300ms avant de filtrer
            
            // Vérifier que la requête n'a pas changé pendant le délai
            if (_uiState.value.restaurantSearchQuery != query) {
                return@launch
            }
            
            // Filtrer localement les restaurants
            val filteredRestaurants = _uiState.value.allRestaurants.filter { restaurant ->
                restaurant.name.contains(query, ignoreCase = true) ||
                restaurant.address.contains(query, ignoreCase = true) ||
                (restaurant.cuisineType?.contains(query, ignoreCase = true) == true)
            }
            
            _uiState.value = _uiState.value.copy(restaurants = filteredRestaurants)
        }
    }

    /**
     * Recherche des utilisateurs (recherche locale avec debouncing).
     */
    fun searchUsers(query: String) {
        // Mettre à jour la requête de recherche immédiatement
        _uiState.value = _uiState.value.copy(userSearchQuery = query)
        
        if (query.isBlank()) {
            // Si la requête est vide, afficher tous les utilisateurs
            _uiState.value = _uiState.value.copy(users = _uiState.value.allUsers)
            return
        }

        // Recherche locale avec debouncing
        viewModelScope.launch {
            delay(300) // Attendre 300ms avant de filtrer
            
            // Vérifier que la requête n'a pas changé pendant le délai
            if (_uiState.value.userSearchQuery != query) {
                return@launch
            }
            
            // Filtrer localement les utilisateurs
            val filteredUsers = _uiState.value.allUsers.filter { user ->
                user.name.contains(query, ignoreCase = true) ||
                user.email.contains(query, ignoreCase = true) ||
                user.role.contains(query, ignoreCase = true)
            }
            
            _uiState.value = _uiState.value.copy(users = filteredUsers)
        }
    }
}
