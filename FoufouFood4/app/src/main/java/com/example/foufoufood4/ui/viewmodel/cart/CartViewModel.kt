package com.example.foufoufood4.ui.viewmodel.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.model.Cart
import com.example.foufoufood4.data.model.CartItem
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.CartRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepository: CartRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CartState())
    val uiState: StateFlow<CartState> = _uiState.asStateFlow()

    init {
        observeCart()
    }

    private fun observeCart() {
        viewModelScope.launch {
            cartRepository.cart.collect { cart ->
                _uiState.value = _uiState.value.copy(
                    cart = cart,
                    isLoading = false
                )
            }
        }
    }

    fun addItemToCart(menuItem: Menu, restaurant: Restaurant, quantity: Int = 1, notes: String = "") {
        if (!cartRepository.canAddToCart(restaurant)) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Vous ne pouvez pas ajouter des articles de différents restaurants dans le même panier"
            )
            return
        }

        cartRepository.addItemToCart(menuItem, restaurant, quantity, notes)
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun updateItemQuantity(menuItemId: String, quantity: Int) {
        if (quantity <= 0) {
            removeItemFromCart(menuItemId)
        } else {
            cartRepository.updateItemQuantity(menuItemId, quantity)
        }
    }

    fun removeItemFromCart(menuItemId: String) {
        cartRepository.removeItemFromCart(menuItemId)
    }

    fun clearCart() {
        cartRepository.clearCart()
    }

    fun getCartItem(menuItemId: String): CartItem? {
        return cartRepository.getCartItem(menuItemId)
    }

    fun canAddToCart(restaurant: Restaurant): Boolean {
        return cartRepository.canAddToCart(restaurant)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}

data class CartState(
    val cart: Cart? = null,
    val isLoading: Boolean = true,
    val errorMessage: String? = null
)
