package com.example.foufoufood4.data.model

data class OrderItemRequest(
    val menuItemId: String,
    val quantity: Int,
    val notes: String
)