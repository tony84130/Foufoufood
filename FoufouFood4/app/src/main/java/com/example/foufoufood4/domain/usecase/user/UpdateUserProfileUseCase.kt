package com.example.foufoufood4.domain.usecase.user

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.request.user.UpdateUserRequest
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.data.repository.UserRepository
import javax.inject.Inject

/**
 * Use Case pour mettre à jour le profil de l'utilisateur.
 * Encapsule la logique métier de validation et de mise à jour.
 */
class UpdateUserProfileUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(request: UpdateUserRequest): Resource<User> {
        // Validation basique
        if (request.name != null && request.name.isBlank()) {
            return Resource.Error("Le nom ne peut pas être vide")
        }
        
        if (request.email != null && !android.util.Patterns.EMAIL_ADDRESS.matcher(request.email).matches()) {
            return Resource.Error("Email invalide")
        }
        
        if (request.password != null && request.password.length < 6) {
            return Resource.Error("Le mot de passe doit contenir au moins 6 caractères")
        }
        
        return userRepository.updateCurrentUser(request)
    }
}

