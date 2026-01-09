package com.example.foufoufood4.domain.usecase.auth

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.AuthRepository
import javax.inject.Inject

/**
 * Use Case pour l'inscription d'un nouvel utilisateur.
 * Encapsule la logique métier d'inscription incluant la validation.
 */
class SignUpUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(
        name: String,
        email: String,
        password: String,
        confirmPassword: String,
        role: String,
        phone: String? = null,
        addressLine1: String? = null,
        addressLine2: String? = null,
        addressCity: String? = null,
        addressRegion: String? = null,
        addressPostalCode: String? = null,
        addressCountry: String? = null
    ): Resource<Unit> {
        // Validation des champs
        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            return Resource.Error("Veuillez remplir tous les champs")
        }

        if (password != confirmPassword) {
            return Resource.Error("Les mots de passe ne correspondent pas")
        }

        if (password.length < 6) {
            return Resource.Error("Le mot de passe doit contenir au moins 6 caractères")
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return Resource.Error("Format d'email invalide")
        }

        // Inscription (le token est sauvegardé automatiquement par le repository)
        return when (val result = authRepository.signUp(
            name = name,
            email = email,
            password = password,
            role = role,
            phone = phone,
            addressLine1 = addressLine1,
            addressLine2 = addressLine2,
            addressCity = addressCity,
            addressRegion = addressRegion,
            addressPostalCode = addressPostalCode,
            addressCountry = addressCountry
        )) {
            is Resource.Success -> Resource.Success(Unit)
            is Resource.Error -> result
            is Resource.Loading -> Resource.Loading
        }
    }
}

