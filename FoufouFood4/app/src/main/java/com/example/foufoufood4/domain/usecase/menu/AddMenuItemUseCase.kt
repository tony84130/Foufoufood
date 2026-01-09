package com.example.foufoufood4.domain.usecase.menu

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.repository.MenuRepository
import javax.inject.Inject

/**
 * Use Case pour ajouter un menu à un restaurant.
 */
class AddMenuItemUseCase @Inject constructor(
    private val menuRepository: MenuRepository
) {
    suspend operator fun invoke(
        restaurantId: String,
        name: String,
        description: String,
        price: Double,
        category: String,
        image: String? = null
    ): Resource<Menu> {
        return menuRepository.addMenuItem(restaurantId, name, description, price, category, image)
    }
}

