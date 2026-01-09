package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour récupérer le menu d'un restaurant spécifique.
 * Encapsule la logique métier de récupération du menu.
 */
class GetRestaurantMenuUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(restaurantId: String): Resource<List<Menu>> {
        if (restaurantId.isBlank()) {
            return Resource.Error("L'ID du restaurant est requis")
        }
        return restaurantRepository.getRestaurantMenu(restaurantId)
    }
}

