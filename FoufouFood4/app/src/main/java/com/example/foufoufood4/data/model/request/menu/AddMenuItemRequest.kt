package com.example.foufoufood4.data.model.request.menu

data class AddMenuItemRequest(
    val restaurantId: String,
    val name: String,
    val description: String,
    val price: Double,
    val category: String,
    val image: String? = null
)

