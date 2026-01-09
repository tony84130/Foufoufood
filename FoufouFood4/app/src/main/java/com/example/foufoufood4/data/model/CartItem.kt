package com.example.foufoufood4.data.model

data class CartItem(
    val menuItem: Menu,
    val quantity: Int,
    val notes: String = ""
) {
    val totalPrice: Double
        get() = menuItem.price * quantity
}

data class Cart(
    val restaurantId: String,
    val restaurantName: String,
    val items: List<CartItem> = emptyList()
) {
    val totalPrice: Double
        get() = items.sumOf { it.totalPrice }
    
    val totalItems: Int
        get() = items.sumOf { it.quantity }
    
    val isEmpty: Boolean
        get() = items.isEmpty()
}
