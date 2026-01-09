package com.example.foufoufood4.ui.viewmodel.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.FavoritesDataStore
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.domain.usecase.restaurant.GetRestaurantsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FavoritesState(
    val favoriteRestaurants: List<Restaurant> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val getRestaurantsUseCase: GetRestaurantsUseCase,
    private val favoritesDataStore: FavoritesDataStore,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(FavoritesState())
    val uiState: StateFlow<FavoritesState> = _uiState.asStateFlow()

    init {
        loadFavoriteRestaurants()
    }

    fun loadFavoriteRestaurants() {
        viewModelScope.launch {
            _uiState.value = FavoritesState(isLoading = true)

            // 1. Récupérer l'ID de l'utilisateur actuel
            val currentUserId = sessionManager.getUserId()
            
            if (currentUserId == null) {
                _uiState.value = FavoritesState(isLoading = false)
                return@launch
            }

            // 2. Load favorite IDs from DataStore pour cet utilisateur
            try {
                val favoriteIds = favoritesDataStore.loadFavoriteRestaurantIdsSync(currentUserId)
                
                if (favoriteIds.isEmpty()) {
                    // No favorites, stop loading
                    _uiState.value = FavoritesState(isLoading = false)
                    return@launch
                }

                // 3. Fetch all restaurants from the use case
                when (val result = getRestaurantsUseCase()) {
                    is Resource.Success -> {
                        val allRestaurants = result.data ?: emptyList()
                        // 4. Filter the list
                        val favoriteRestaurants = allRestaurants.filter { restaurant ->
                            favoriteIds.contains(restaurant.id)
                        }
                        _uiState.value = FavoritesState(
                            isLoading = false,
                            favoriteRestaurants = favoriteRestaurants
                        )
                    }
                    is Resource.Error -> {
                        _uiState.value = FavoritesState(
                            isLoading = false,
                            errorMessage = result.message
                        )
                    }
                    is Resource.Loading -> {
                        // Handled by initial state
                    }
                }
            } catch (e: Exception) {
                _uiState.value = FavoritesState(
                    isLoading = false,
                    errorMessage = "Erreur lors du chargement des favoris: ${e.message}"
                )
            }
        }
    }

    /**
     * Recharge les favoris depuis les préférences pour l'utilisateur actuel.
     * Utile lorsque l'utilisateur change ou se reconnecte.
     */
    fun reloadFavorites() {
        loadFavoriteRestaurants()
    }
}