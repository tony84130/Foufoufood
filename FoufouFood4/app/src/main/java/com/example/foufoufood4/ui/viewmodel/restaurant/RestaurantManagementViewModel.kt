package com.example.foufoufood4.ui.viewmodel.restaurant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.domain.usecase.restaurant.CreateRestaurantUseCase
import com.example.foufoufood4.domain.usecase.restaurant.UpdateRestaurantUseCase
import com.example.foufoufood4.domain.usecase.restaurant.DeleteRestaurantUseCase
import com.example.foufoufood4.domain.usecase.restaurant.GetRestaurantsUseCase
import com.example.foufoufood4.domain.usecase.restaurant.GetMyRestaurantsUseCase
import com.example.foufoufood4.domain.usecase.menu.AddMenuItemUseCase
import com.example.foufoufood4.domain.usecase.menu.UpdateMenuItemUseCase
import com.example.foufoufood4.domain.usecase.menu.DeleteMenuItemUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * État pour la gestion des restaurants et menus.
 */
data class RestaurantManagementState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val currentRestaurant: Restaurant? = null,
    val menus: List<Menu> = emptyList(),
    val showEditRestaurantDialog: Boolean = false,
    val showAddMenuDialog: Boolean = false,
    val showEditMenuDialog: Boolean = false,
    val selectedMenu: Menu? = null
)

@HiltViewModel
class RestaurantManagementViewModel @Inject constructor(
    private val createRestaurantUseCase: CreateRestaurantUseCase,
    private val updateRestaurantUseCase: UpdateRestaurantUseCase,
    private val deleteRestaurantUseCase: DeleteRestaurantUseCase,
    private val getRestaurantsUseCase: GetRestaurantsUseCase,
    private val getMyRestaurantsUseCase: GetMyRestaurantsUseCase,
    private val addMenuItemUseCase: AddMenuItemUseCase,
    private val updateMenuItemUseCase: UpdateMenuItemUseCase,
    private val deleteMenuItemUseCase: DeleteMenuItemUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(RestaurantManagementState())
    val uiState: StateFlow<RestaurantManagementState> = _uiState.asStateFlow()

    /**
     * Crée un nouveau restaurant.
     */
    fun createRestaurant(
        name: String,
        address: String,
        cuisineType: String? = null,
        phone: String? = null,
        openingHours: List<com.example.foufoufood4.data.model.OpeningHours>? = null,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            when (val result = createRestaurantUseCase(name, address, cuisineType, phone, openingHours)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Restaurant créé avec succès !",
                        currentRestaurant = result.data
                    )
                    onSuccess()
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
     * Met à jour un restaurant.
     */
    fun updateRestaurant(
        restaurantId: String,
        name: String?,
        address: String?,
        cuisineType: String? = null,
        phone: String? = null,
        openingHours: List<com.example.foufoufood4.data.model.OpeningHours>? = null,
        rating: Double? = null,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            when (val result = updateRestaurantUseCase(restaurantId, name, address, cuisineType, phone, openingHours, rating)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Restaurant mis à jour !",
                        currentRestaurant = result.data,
                        showEditRestaurantDialog = false
                    )
                    onSuccess()
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
     * Supprime un restaurant.
     */
    fun deleteRestaurant(restaurantId: String, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            when (val result = deleteRestaurantUseCase(restaurantId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Restaurant supprimé !"
                    )
                    onSuccess()
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
     * Ajoute un menu à un restaurant.
     */
    fun addMenuItem(
        restaurantId: String,
        name: String,
        description: String,
        price: Double,
        category: String,
        image: String? = null,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            when (val result = addMenuItemUseCase(restaurantId, name, description, price, category, image)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Menu ajouté avec succès !",
                        showAddMenuDialog = false
                    )
                    onSuccess()
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
     * Met à jour un menu.
     */
    fun updateMenuItem(
        menuId: String,
        name: String?,
        description: String?,
        price: Double?,
        category: String?,
        image: String? = null,
        onSuccess: () -> Unit = {}
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            when (val result = updateMenuItemUseCase(menuId, name, description, price, category, image)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Menu mis à jour !",
                        showEditMenuDialog = false,
                        selectedMenu = null
                    )
                    onSuccess()
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
     * Supprime un menu.
     */
    fun deleteMenuItem(menuId: String, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)

            when (val result = deleteMenuItemUseCase(menuId)) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        successMessage = "Menu supprimé !"
                    )
                    onSuccess()
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
     * Affiche le dialog d'édition de restaurant.
     */
    fun showEditRestaurantDialog(restaurant: Restaurant) {
        _uiState.value = _uiState.value.copy(
            showEditRestaurantDialog = true,
            currentRestaurant = restaurant
        )
    }

    /**
     * Cache le dialog d'édition de restaurant.
     */
    fun hideEditRestaurantDialog() {
        _uiState.value = _uiState.value.copy(showEditRestaurantDialog = false)
    }

    /**
     * Affiche le dialog d'ajout de menu.
     */
    fun showAddMenuDialog() {
        _uiState.value = _uiState.value.copy(showAddMenuDialog = true)
    }

    /**
     * Cache le dialog d'ajout de menu.
     */
    fun hideAddMenuDialog() {
        _uiState.value = _uiState.value.copy(showAddMenuDialog = false)
    }

    /**
     * Affiche le dialog d'édition de menu.
     */
    fun showEditMenuDialog(menu: Menu) {
        _uiState.value = _uiState.value.copy(
            showEditMenuDialog = true,
            selectedMenu = menu
        )
    }

    /**
     * Cache le dialog d'édition de menu.
     */
    fun hideEditMenuDialog() {
        _uiState.value = _uiState.value.copy(
            showEditMenuDialog = false,
            selectedMenu = null
        )
    }

    /**
     * Efface les messages.
     */
    fun clearMessages() {
        _uiState.value = _uiState.value.copy(errorMessage = null, successMessage = null)
    }
}

