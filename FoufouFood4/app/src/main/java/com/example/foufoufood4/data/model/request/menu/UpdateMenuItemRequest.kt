package com.example.foufoufood4.data.model.request.menu

data class UpdateMenuItemRequest(
    val name: String?,
    val description: String?,
    val price: Double?,
    val category: String?,
    val image: String? = null
)

