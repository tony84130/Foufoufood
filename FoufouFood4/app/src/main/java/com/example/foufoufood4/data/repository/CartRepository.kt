package com.example.foufoufood4.data.repository

import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.Cart
import com.example.foufoufood4.data.model.CartItem
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.Restaurant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CartRepository @Inject constructor(
    private val sessionManager: SessionManager
) {
    private val _cart = MutableStateFlow<Cart?>(null)
    val cart: StateFlow<Cart?> = _cart.asStateFlow()

    fun addItemToCart(menuItem: Menu, restaurant: Restaurant, quantity: Int = 1, notes: String = "") {
        val currentCart = _cart.value
        
        if (currentCart == null) {
            // Créer un nouveau panier
            val newCart = Cart(
                restaurantId = restaurant.id,
                restaurantName = restaurant.name,
                items = listOf(CartItem(menuItem, quantity, notes))
            )
            _cart.value = newCart
        } else if (currentCart.restaurantId == restaurant.id) {
            // Ajouter au panier existant du même restaurant
            val existingItemIndex = currentCart.items.indexOfFirst { it.menuItem.id == menuItem.id }
            
            val updatedItems = if (existingItemIndex != -1) {
                // Mettre à jour la quantité de l'item existant
                currentCart.items.toMutableList().apply {
                    val existingItem = this[existingItemIndex]
                    this[existingItemIndex] = existingItem.copy(
                        quantity = existingItem.quantity + quantity,
                        notes = if (notes.isNotEmpty()) notes else existingItem.notes
                    )
                }
            } else {
                // Ajouter un nouvel item
                currentCart.items + CartItem(menuItem, quantity, notes)
            }
            
            _cart.value = currentCart.copy(items = updatedItems)
        } else {
            // Vider le panier et créer un nouveau pour un autre restaurant
            val newCart = Cart(
                restaurantId = restaurant.id,
                restaurantName = restaurant.name,
                items = listOf(CartItem(menuItem, quantity, notes))
            )
            _cart.value = newCart
        }
    }

    fun updateItemQuantity(menuItemId: String, quantity: Int) {
        val currentCart = _cart.value ?: return
        
        val updatedItems = currentCart.items.map { item ->
            if (item.menuItem.id == menuItemId) {
                item.copy(quantity = quantity)
            } else {
                item
            }
        }.filter { it.quantity > 0 } // Supprimer les items avec quantité 0
        
        _cart.value = currentCart.copy(items = updatedItems)
    }

    fun removeItemFromCart(menuItemId: String) {
        val currentCart = _cart.value ?: return
        
        val updatedItems = currentCart.items.filter { it.menuItem.id != menuItemId }
        
        if (updatedItems.isEmpty()) {
            _cart.value = null
        } else {
            _cart.value = currentCart.copy(items = updatedItems)
        }
    }

    fun clearCart() {
        _cart.value = null
    }

    fun getCartItem(menuItemId: String): CartItem? {
        return _cart.value?.items?.find { it.menuItem.id == menuItemId }
    }

    fun getCartItemCount(): Int {
        return _cart.value?.totalItems ?: 0
    }

    fun getCartTotal(): Double {
        return _cart.value?.totalPrice ?: 0.0
    }

    fun isCartEmpty(): Boolean {
        return _cart.value?.isEmpty ?: true
    }

    fun canAddToCart(restaurant: Restaurant): Boolean {
        val currentCart = _cart.value
        return currentCart == null || currentCart.restaurantId == restaurant.id
    }
}
