package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour supprimer un avis d'un restaurant.
 */
class DeleteRestaurantReviewUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend operator fun invoke(restaurantId: String): Resource<Restaurant> {
        return repository.deleteRestaurantReview(restaurantId)
    }
}

