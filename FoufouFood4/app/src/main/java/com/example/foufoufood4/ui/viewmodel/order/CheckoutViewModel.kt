package com.example.foufoufood4.ui.viewmodel.order

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.model.DeliveryAddress
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.data.model.Address
import com.example.foufoufood4.data.repository.OrderRepository
import com.example.foufoufood4.data.repository.CartRepository
import com.example.foufoufood4.domain.usecase.user.GetCurrentUserUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlinx.coroutines.flow.firstOrNull
import android.util.Log

@HiltViewModel
class CheckoutViewModel @Inject constructor(
    private val orderRepository: OrderRepository,
    private val cartRepository: CartRepository,
    private val getCurrentUserUseCase: GetCurrentUserUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(CheckoutState())
    val uiState: StateFlow<CheckoutState> = _uiState.asStateFlow()

    init {
        loadUserAddress()
    }

    /**
     * Charge l'adresse de l'utilisateur actuel pour pré-remplir le formulaire.
     */
    fun loadUserAddress() {
        viewModelScope.launch {
            try {
                when (val result = getCurrentUserUseCase()) {
                    is com.example.foufoufood4.data.common.Resource.Success -> {
                        val userAddress = result.data.address
                        if (userAddress != null) {
                            _uiState.value = _uiState.value.copy(
                                userAddress = userAddress
                            )
                        }
                    }
                    else -> {
                        // Si l'adresse ne peut pas être chargée, on continue sans pré-remplissage
                        Log.d("CheckoutViewModel", "Could not load user address: ${(result as? com.example.foufoufood4.data.common.Resource.Error)?.message}")
                    }
                }
            } catch (e: Exception) {
                Log.e("CheckoutViewModel", "Error loading user address", e)
            }
        }
    }

    fun createOrder(deliveryAddress: DeliveryAddress) {
        viewModelScope.launch {
            Log.d("CheckoutVM", "createOrder started. Setting isLoading=true") // Log start
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val currentCart = cartRepository.cart.firstOrNull()

            if (currentCart == null || currentCart.isEmpty) {
                Log.e("CheckoutVM", "Cart is empty, aborting.") // Log cart empty
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Votre panier est vide"
                )
                return@launch
            }

            Log.d("CheckoutVM", "Calling repository.createOrder...") // Log before repo call
            orderRepository.createOrder(deliveryAddress, currentCart).collect { resource ->
                Log.d("CheckoutVM", "Collected resource: $resource") // Log resource received
                when (resource) {
                    is com.example.foufoufood4.data.common.Resource.Loading -> {
                        Log.d("CheckoutVM", "Resource.Loading received") // Log loading
                        _uiState.value = _uiState.value.copy(isLoading = true)
                    }
                    is com.example.foufoufood4.data.common.Resource.Success -> {
                        Log.d("CheckoutVM", "Resource.Success received! Order: ${resource.data}") // Log success
                        cartRepository.clearCart()
                        Log.d("CheckoutVM", "Setting state: isLoading=false, isOrderCreated=true") // Log state update attempt
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            isOrderCreated = true,
                            order = resource.data
                        )
                        Log.d("CheckoutVM", "State updated? Current state: ${_uiState.value}") // Log state after update
                    }
                    is com.example.foufoufood4.data.common.Resource.Error -> {
                        Log.e("CheckoutVM", "Resource.Error received: ${resource.message}") // Log error
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                }
            }
            Log.d("CheckoutVM", "Finished collecting resources.") // Log after collect finishes
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun resetOrderCreated() {
        _uiState.value = _uiState.value.copy(isOrderCreated = false)
    }
}

data class CheckoutState(
    val isLoading: Boolean = false,
    val isOrderCreated: Boolean = false,
    val order: Order? = null,
    val errorMessage: String? = null,
    val userAddress: Address? = null // Adresse de l'utilisateur pour pré-remplissage
)
