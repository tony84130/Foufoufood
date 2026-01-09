package com.example.foufoufood4.domain.usecase.user

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.AdminRepository
import javax.inject.Inject

/**
 * Use Case pour supprimer un utilisateur.
 * Réservé aux platform_admin.
 */
class DeleteUserUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(userId: String): Resource<String> {
        // Validation : l'ID ne peut pas être vide
        if (userId.isBlank()) {
            return Resource.Error("L'ID de l'utilisateur ne peut pas être vide.")
        }

        return adminRepository.deleteUser(userId)
    }
}

