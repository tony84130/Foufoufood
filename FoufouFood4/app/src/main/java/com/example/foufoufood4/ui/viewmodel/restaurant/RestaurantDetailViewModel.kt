package com.example.foufoufood4.ui.viewmodel.restaurant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.MenuRepository
import com.example.foufoufood4.domain.usecase.restaurant.GetRestaurantByIdUseCase
import com.example.foufoufood4.domain.usecase.restaurant.GetRestaurantMenuUseCase
import com.example.foufoufood4.domain.usecase.restaurant.AddRestaurantReviewUseCase
import com.example.foufoufood4.domain.usecase.restaurant.DeleteRestaurantReviewUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import javax.inject.Inject

/**
 * État de l'interface utilisateur pour l'écran de détails du restaurant.
 */
data class RestaurantDetailState(
    val restaurant: Restaurant? = null,
    val menuItems: List<Menu> = emptyList(),
    val allMenuItems: List<Menu> = emptyList(), // Tous les items du menu (pour la recherche locale)
    val searchQuery: String = "", // Requête de recherche actuelle
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class RestaurantDetailViewModel @Inject constructor(
    private val getRestaurantByIdUseCase: GetRestaurantByIdUseCase,
    private val getRestaurantMenuUseCase: GetRestaurantMenuUseCase,
    private val addRestaurantReviewUseCase: AddRestaurantReviewUseCase,
    private val deleteRestaurantReviewUseCase: DeleteRestaurantReviewUseCase,
    private val menuRepository: MenuRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(RestaurantDetailState())
    val uiState: StateFlow<RestaurantDetailState> = _uiState.asStateFlow()

    /**
     * Charge toutes les données du restaurant (infos + menu).
     */
    fun loadRestaurantDetails(restaurantId: String) {
        viewModelScope.launch {
            _uiState.value = RestaurantDetailState(isLoading = true)
            
            // Charger les informations du restaurant
            val restaurantResult = getRestaurantByIdUseCase(restaurantId)
            
            // Charger le menu du restaurant
            val menuResult = getRestaurantMenuUseCase(restaurantId)
            
            when {
                restaurantResult is Resource.Error -> {
                    _uiState.value = RestaurantDetailState(
                        errorMessage = "Erreur lors du chargement des informations: ${restaurantResult.message}"
                    )
                }
                menuResult is Resource.Error -> {
                    _uiState.value = RestaurantDetailState(
                        restaurant = (restaurantResult as? Resource.Success)?.data,
                        errorMessage = "Erreur lors du chargement du menu: ${menuResult.message}"
                    )
                }
                restaurantResult is Resource.Success && menuResult is Resource.Success -> {
                    _uiState.value = RestaurantDetailState(
                        restaurant = restaurantResult.data,
                        menuItems = menuResult.data,
                        allMenuItems = menuResult.data // Sauvegarder tous les items pour la recherche locale
                    )
                }
                else -> {
                    _uiState.value = RestaurantDetailState(
                        errorMessage = "Erreur inattendue lors du chargement"
                    )
                }
            }
        }
    }

    /**
     * Récupère le menu d'un restaurant spécifique via le use case.
     * @deprecated Utilisez loadRestaurantDetails() à la place.
     */
    @Deprecated("Use loadRestaurantDetails() instead", ReplaceWith("loadRestaurantDetails(restaurantId)"))
    fun fetchMenu(restaurantId: String) {
        loadRestaurantDetails(restaurantId)
    }

    /**
     * Recherche des items de menu dans le restaurant (recherche locale avec debouncing).
     */
    fun searchMenuItems(restaurantId: String, query: String) {
        // Mettre à jour la requête de recherche immédiatement
        _uiState.value = _uiState.value.copy(searchQuery = query)
        
        if (query.isBlank()) {
            // Si la requête est vide, afficher tous les items
            _uiState.value = _uiState.value.copy(menuItems = _uiState.value.allMenuItems)
            return
        }

        // Recherche locale avec debouncing
        viewModelScope.launch {
            delay(300) // Attendre 300ms avant de filtrer
            
            // Vérifier que la requête n'a pas changé pendant le délai
            if (_uiState.value.searchQuery != query) {
                return@launch
            }
            
            // Filtrer localement les items du menu
            val filteredItems = _uiState.value.allMenuItems.filter { menuItem ->
                menuItem.name.contains(query, ignoreCase = true) ||
                menuItem.description.contains(query, ignoreCase = true) ||
                menuItem.category.contains(query, ignoreCase = true)
            }
            
            _uiState.value = _uiState.value.copy(menuItems = filteredItems)
        }
    }

    /**
     * Ajoute ou met à jour un avis pour le restaurant.
     */
    fun addReview(restaurantId: String, rating: Int, comment: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            when (val result = addRestaurantReviewUseCase(restaurantId, rating, comment)) {
                is Resource.Success -> {
                    // Mettre à jour le restaurant avec les nouvelles données
                    _uiState.value = _uiState.value.copy(
                        restaurant = result.data,
                        isLoading = false
                    )
                    // Recharger les détails pour avoir les données à jour
                    loadRestaurantDetails(restaurantId)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = result.message
                    )
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }

    /**
     * Supprime un avis du restaurant.
     */
    fun deleteReview(restaurantId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            
            when (val result = deleteRestaurantReviewUseCase(restaurantId)) {
                is Resource.Success -> {
                    // Mettre à jour le restaurant avec les nouvelles données
                    _uiState.value = _uiState.value.copy(
                        restaurant = result.data,
                        isLoading = false
                    )
                    // Recharger les détails pour avoir les données à jour
                    loadRestaurantDetails(restaurantId)
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = result.message
                    )
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }
}
