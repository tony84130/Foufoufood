package com.example.foufoufood4.data.model

import com.google.gson.annotations.SerializedName

/**
 * Modèle représentant un utilisateur de l'application.
 */
data class User(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("name")
    val name: String,
    
    @SerializedName("email")
    val email: String,
    
    @SerializedName("phone")
    val phone: String? = null,
    
    @SerializedName("address")
    val address: Address? = null,
    
    @SerializedName("role")
    val role: String,
    
    @SerializedName("restaurants")
    val restaurants: List<String>? = null,
    
    @SerializedName("orders")
    val orders: List<String>? = null,
    
    @SerializedName("createdAt")
    val createdAt: String? = null,
    
    @SerializedName("updatedAt")
    val updatedAt: String? = null
) {
    /**
     * Retourne les initiales de l'utilisateur (première lettre de chaque partie du nom).
     */
    fun getInitials(): String {
        val parts = name.split(" ")
        return if (parts.size >= 2) {
            "${parts[0].first()}${parts[1].first()}".uppercase()
        } else if (parts.isNotEmpty()) {
            parts[0].first().toString().uppercase()
        } else {
            ""
        }
    }
    
    /**
     * Retourne le rôle de l'utilisateur en français.
     */
    fun getRoleDisplayName(): String {
        return when (role) {
            "client" -> "Client"
            "delivery_partner" -> "Livreur"
            "restaurant_admin" -> "Administrateur Restaurant"
            "platform_admin" -> "Administrateur Plateforme"
            else -> role.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
    }
}

/**
 * Réponse du serveur pour un utilisateur unique.
 */
data class UserResponse(
    @SerializedName("success")
    val success: Boolean,
    
    @SerializedName("data")
    val data: User
)

