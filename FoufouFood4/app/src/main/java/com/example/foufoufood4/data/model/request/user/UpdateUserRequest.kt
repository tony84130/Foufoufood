package com.example.foufoufood4.data.model.request.user
import com.example.foufoufood4.data.model.Address

/**
 * Requête pour mettre à jour le profil de l'utilisateur.
 */
data class UpdateUserRequest(
    val name: String? = null,
    val email: String? = null,
    val password: String? = null,
    val phone: String? = null,
    val address: Address? = null
)

