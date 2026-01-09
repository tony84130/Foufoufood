package com.example.foufoufood4.domain.usecase.user

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.data.repository.AdminRepository
import javax.inject.Inject

/**
 * Use Case pour récupérer tous les utilisateurs.
 * Réservé aux platform_admin.
 */
class GetAllUsersUseCase @Inject constructor(
    private val adminRepository: AdminRepository
) {
    suspend operator fun invoke(): Resource<List<User>> {
        return adminRepository.getAllUsers()
    }
}

