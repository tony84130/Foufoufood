package com.example.foufoufood4.data.model.request.admin
import com.example.foufoufood4.data.model.Address

/**
 * Modèle de requête pour créer un restaurant avec son administrateur.
 */
data class CreateRestaurantAdminRequest(
    val restaurantName: String,
    val restaurantAddress: String,
    val adminName: String,
    val adminEmail: String,
    val adminPassword: String
)

