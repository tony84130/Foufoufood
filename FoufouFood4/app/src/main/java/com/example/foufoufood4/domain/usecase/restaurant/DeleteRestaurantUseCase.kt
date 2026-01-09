package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour supprimer un restaurant.
 */
class DeleteRestaurantUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(restaurantId: String): Resource<String> {
        return restaurantRepository.deleteRestaurant(restaurantId)
    }
}

