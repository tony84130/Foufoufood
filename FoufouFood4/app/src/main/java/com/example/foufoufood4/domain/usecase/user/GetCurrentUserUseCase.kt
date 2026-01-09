package com.example.foufoufood4.domain.usecase.user

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.data.repository.UserRepository
import javax.inject.Inject

/**
 * Use Case pour récupérer les informations de l'utilisateur actuellement connecté.
 */
class GetCurrentUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(): Resource<User> {
        return userRepository.getCurrentUser()
    }
}

