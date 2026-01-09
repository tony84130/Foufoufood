package com.example.foufoufood4.ui.viewmodel.restaurant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.domain.usecase.restaurant.GetRestaurantsUseCase
import com.example.foufoufood4.ui.screens.restaurant.RestaurantSortOption
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update // <-- IMPORT AJOUTÉ : Nécessaire pour _uiState.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import android.util.Log
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.local.FavoritesDataStore
import kotlinx.coroutines.flow.mapNotNull
import kotlinx.coroutines.flow.first

/**
 * État de l'interface utilisateur pour l'écran de liste des restaurants.
 */
data class RestaurantListState(
    val restaurants: List<Restaurant> = emptyList(),
    val searchText: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val favoriteRestaurantIds: Set<String> = emptySet()
)

@HiltViewModel
class RestaurantListViewModel @Inject constructor(
    private val getRestaurantsUseCase: GetRestaurantsUseCase,
    private val sessionManager: SessionManager,
    private val favoritesDataStore: FavoritesDataStore
) : ViewModel() {

    // Liste complète des restaurants (état interne)
    private val _fullRestaurantList = MutableStateFlow<List<Restaurant>>(emptyList())

    // État interne pour l'option de tri sélectionnée (par défaut : Note descendante)
    private val _sortOption = MutableStateFlow(RestaurantSortOption.RATING_DESC)
    val sortOption: StateFlow<RestaurantSortOption> = _sortOption.asStateFlow()

    // État interne pour les IDs de restaurants favoris
    private val _favorites = MutableStateFlow<Set<String>>(emptySet())

    // État de l'interface utilisateur final
    private val _uiState = MutableStateFlow(RestaurantListState())
    val uiState: StateFlow<RestaurantListState> = _uiState.asStateFlow()

    init {
        Log.d("RestaurantListViewModel", "init - ViewModel INITIALIZED")
        
        // Charger les favoris immédiatement et observer les changements
        viewModelScope.launch {
            // Attendre un peu pour que la session soit chargée
            kotlinx.coroutines.delay(200)
            
            val currentUserId = sessionManager.getUserId()
            if (currentUserId != null) {
                Log.d("RestaurantListViewModel", "init - Loading favorites for userId: $currentUserId")
                
                // Charger immédiatement
                try {
                    val initialFavorites = favoritesDataStore.loadFavoriteRestaurantIdsSync(currentUserId)
                    Log.d("RestaurantListViewModel", "init - Initial favorites loaded: $initialFavorites")
                    _favorites.value = initialFavorites
                } catch (e: Exception) {
                    Log.e("RestaurantListViewModel", "init - Error loading initial favorites: ${e.message}", e)
                }
                
                // Observer les changements en continu
                favoritesDataStore.loadFavoriteRestaurantIds(currentUserId).collect { favorites ->
                    Log.d("RestaurantListViewModel", "init - Favorites updated from DataStore: $favorites")
                    _favorites.value = favorites
                }
            } else {
                Log.w("RestaurantListViewModel", "init - userId is null, favorites will be empty")
            }
        }

        // Combinez les changements de texte de recherche, d'option de tri et de favoris
        viewModelScope.launch {
            combine(
                _uiState.map { it.searchText },
                _sortOption,
                _fullRestaurantList,
                _favorites
            ) { searchText, sortOption, fullList, favorites ->
                // Ici, on retourne un objet unique avec toutes les données nécessaires
                DataCriteria(searchText, sortOption, fullList, favorites)
            }.collect { criteria ->
                // Correction : Utilisation d'un objet simple pour la déstructuration
                updateFilteredAndSortedList(criteria.searchText, criteria.sortOption, criteria.fullList)

                // Mettre à jour l'ensemble des IDs favoris dans l'UI State
                Log.d("RestaurantListViewModel", "combine - Updating favoriteRestaurantIds with: ${criteria.favorites}")
                _uiState.update { it.copy(favoriteRestaurantIds = criteria.favorites) }
            }
        }
        fetchRestaurants()
    }

    // Classe de données interne pour simplifier le passage des critères dans le combine
    private data class DataCriteria(
        val searchText: String,
        val sortOption: RestaurantSortOption,
        val fullList: List<Restaurant>,
        val favorites: Set<String>
    )

    /**
     * Récupère la liste des restaurants depuis le use case.
     */
    fun fetchRestaurants() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }

            when (val result = getRestaurantsUseCase()) {
                is Resource.Success -> {
                    _fullRestaurantList.value = result.data ?: emptyList()
                    _uiState.update { it.copy(isLoading = false, errorMessage = null) }
                    // Le bloc `combine` gère la mise à jour de la liste UI
                }
                is Resource.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message
                        )
                    }
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }

    /**
     * Met à jour l'option de tri et déclenche la mise à jour de la liste via `combine`.
     */
    fun onSortOptionSelected(newSortOption: RestaurantSortOption) {
        _sortOption.value = newSortOption
    }

    /**
     * Met à jour le texte de recherche et déclenche la mise à jour de la liste via `combine`.
     */
    fun onSearchTextChanged(text: String) {
        _uiState.update { it.copy(searchText = text) }
    }

    /**
     * Bascule l'état de favori et met à jour les préférences.
     */
    fun toggleFavorite(restaurantId: String) {
        viewModelScope.launch {
            val currentUserId = sessionManager.getUserId()
            Log.d("RestaurantListViewModel", "toggleFavorite - userId: $currentUserId, restaurantId: $restaurantId")
            
            if (currentUserId == null) {
                Log.e("RestaurantListViewModel", "toggleFavorite - userId is null, cannot save favorites")
                return@launch
            }
            
            val currentFavorites = _favorites.value
            val newFavorites = if (currentFavorites.contains(restaurantId)) {
                currentFavorites - restaurantId
            } else {
                currentFavorites + restaurantId
            }
            _favorites.value = newFavorites
            Log.d("RestaurantListViewModel", "toggleFavorite - Saving favorites: $newFavorites")
            
            // Sauvegarder avec DataStore
            favoritesDataStore.saveFavoriteRestaurantIds(currentUserId, newFavorites)
            
            // Vérifier que la sauvegarde a fonctionné
            val savedFavorites = favoritesDataStore.loadFavoriteRestaurantIdsSync(currentUserId)
            Log.d("RestaurantListViewModel", "toggleFavorite - Verification: loaded favorites after save: $savedFavorites")
        }
    }

    /**
     * Recharge les favoris depuis les préférences pour l'utilisateur actuel.
     * Utile lorsque l'utilisateur change ou se reconnecte.
     */
    fun reloadFavorites() {
        Log.d("RestaurantListViewModel", "reloadFavorites - Called")
        // Le Flow dans init() observe déjà les changements automatiquement
        // Cette méthode est conservée pour compatibilité mais n'est plus nécessaire
    }

    /**
     * Filtre et trie la liste en fonction des critères actuels.
     * Cette fonction est appelée automatiquement par le bloc `combine`.
     */
    private fun updateFilteredAndSortedList(
        searchText: String,
        sortOption: RestaurantSortOption,
        fullList: List<Restaurant>
    ) {
        val lowerCaseSearchText = searchText.lowercase().trim()
        var list = fullList

        // 1. FILTRAGE
        list = if (lowerCaseSearchText.isBlank()) {
            list
        } else {
            list.filter { restaurant ->
                // Filtrage sur le nom ET le type de cuisine (cuisineType)
                restaurant.name.lowercase().contains(lowerCaseSearchText) ||
                        (restaurant.cuisineType?.lowercase() ?: "").contains(lowerCaseSearchText)
            }
        }

        // 2. TRI
        val sortedList = when (sortOption) {
            RestaurantSortOption.NAME_ASC -> list.sortedBy { it.name }
            RestaurantSortOption.RATING_DESC -> list.sortedByDescending { it.getRating() }
            RestaurantSortOption.PRICE_ASC -> list.sortedBy { it.price }
        }

        // 3. Mise à jour de l'UI State de la liste affichée
        _uiState.update { it.copy(restaurants = sortedList) }
    }
}