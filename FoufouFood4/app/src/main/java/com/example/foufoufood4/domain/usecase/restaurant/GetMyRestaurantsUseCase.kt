package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour récupérer les restaurants de l'utilisateur actuel (restaurant_admin).
 */
class GetMyRestaurantsUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(): Resource<List<Restaurant>> {
        return restaurantRepository.getMyRestaurants()
    }
}

