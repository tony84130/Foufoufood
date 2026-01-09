package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour ajouter ou mettre à jour un avis pour un restaurant.
 */
class AddRestaurantReviewUseCase @Inject constructor(
    private val repository: RestaurantRepository
) {
    suspend operator fun invoke(
        restaurantId: String,
        rating: Int,
        comment: String? = null
    ): Resource<Restaurant> {
        return repository.addRestaurantReview(restaurantId, rating, comment)
    }
}

