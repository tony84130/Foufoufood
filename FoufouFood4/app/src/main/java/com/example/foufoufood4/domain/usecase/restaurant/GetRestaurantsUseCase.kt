package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour récupérer la liste des restaurants.
 * Encapsule la logique métier de récupération des restaurants.
 */
class GetRestaurantsUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(): Resource<List<Restaurant>> {
        return restaurantRepository.getRestaurants()
    }
}

