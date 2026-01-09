package com.example.foufoufood4.domain.usecase.admin

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.response.CreateRestaurantAdminResponse
import com.example.foufoufood4.data.repository.AdminRepository
import javax.inject.Inject

/**
 * Use Case pour créer un restaurant avec son administrateur.
 * Réservé aux platform_admin.
 */
class CreateRestaurantAdminUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(
        restaurantName: String,
        restaurantAddress: String,
        adminName: String,
        adminEmail: String,
        adminPassword: String
    ): Resource<CreateRestaurantAdminResponse> {
        // Validations
        if (restaurantName.isBlank()) {
            return Resource.Error("Le nom du restaurant ne peut pas être vide.")
        }
        if (restaurantAddress.isBlank()) {
            return Resource.Error("L'adresse du restaurant ne peut pas être vide.")
        }
        if (adminName.isBlank()) {
            return Resource.Error("Le nom de l'administrateur ne peut pas être vide.")
        }
        if (adminEmail.isBlank()) {
            return Resource.Error("L'email de l'administrateur ne peut pas être vide.")
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(adminEmail).matches()) {
            return Resource.Error("Format d'email invalide.")
        }
        if (adminPassword.length < 6) {
            return Resource.Error("Le mot de passe doit contenir au moins 6 caractères.")
        }

        return adminRepository.createRestaurantWithAdmin(
            restaurantName = restaurantName,
            restaurantAddress = restaurantAddress,
            adminName = adminName,
            adminEmail = adminEmail,
            adminPassword = adminPassword
        )
    }
}

