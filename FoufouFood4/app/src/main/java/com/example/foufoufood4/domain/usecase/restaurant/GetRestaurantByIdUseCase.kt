package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour récupérer les informations d'un restaurant spécifique.
 */
class GetRestaurantByIdUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend operator fun invoke(restaurantId: String): Resource<Restaurant> {
        return repository.getRestaurantById(restaurantId)
    }
}

