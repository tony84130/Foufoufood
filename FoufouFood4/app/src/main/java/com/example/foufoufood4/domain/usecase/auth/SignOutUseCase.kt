package com.example.foufoufood4.domain.usecase.auth

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.AuthRepository
import javax.inject.Inject

/**
 * Use Case pour déconnecter l'utilisateur.
 * Invalide la session côté serveur et efface les données locales.
 */
class SignOutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Resource<Unit> {
        return authRepository.signOut()
    }
}

