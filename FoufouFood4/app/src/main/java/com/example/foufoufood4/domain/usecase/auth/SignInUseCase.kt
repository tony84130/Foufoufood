package com.example.foufoufood4.domain.usecase.auth

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.AuthRepository
import javax.inject.Inject

/**
 * Use Case pour la connexion d'un utilisateur.
 * Encapsule la logique métier de connexion incluant la validation.
 */
class SignInUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Resource<Unit> {
        // Validation des champs
        if (email.isBlank() || password.isBlank()) {
            return Resource.Error("Veuillez remplir tous les champs")
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return Resource.Error("Format d'email invalide")
        }

        // Connexion (le token est sauvegardé automatiquement par le repository)
        return when (val result = authRepository.signIn(email, password)) {
            is Resource.Success -> Resource.Success(Unit)
            is Resource.Error -> result
            is Resource.Loading -> Resource.Loading
        }
    }
}

