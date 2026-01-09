package com.example.foufoufood4.domain.usecase.user

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.UserRepository
import javax.inject.Inject

/**
 * Use Case pour supprimer le compte de l'utilisateur actuellement connecté.
 * Cette opération est irréversible et supprime toutes les données associées.
 */
class DeleteCurrentUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(): Resource<Unit> {
        return userRepository.deleteCurrentUser()
    }
}

