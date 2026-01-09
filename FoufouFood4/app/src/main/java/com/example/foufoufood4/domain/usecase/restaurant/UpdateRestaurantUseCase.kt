package com.example.foufoufood4.domain.usecase.restaurant

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.repository.RestaurantRepository
import javax.inject.Inject

/**
 * Use Case pour mettre à jour un restaurant.
 */
class UpdateRestaurantUseCase @Inject constructor(
    private val restaurantRepository: RestaurantRepository
) {
    suspend operator fun invoke(
        restaurantId: String,
        name: String?,
        address: String?,
        cuisineType: String? = null,
        phone: String? = null,
        openingHours: List<com.example.foufoufood4.data.model.OpeningHours>? = null,
        rating: Double? = null
    ): Resource<Restaurant> {
        return restaurantRepository.updateRestaurant(restaurantId, name, address, cuisineType, phone, openingHours, rating)
    }
}

