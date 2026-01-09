package com.example.foufoufood4.domain.usecase.menu

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.MenuRepository
import javax.inject.Inject

/**
 * Use Case pour supprimer un menu.
 */
class DeleteMenuItemUseCase @Inject constructor(
    private val menuRepository: MenuRepository
) {
    suspend operator fun invoke(menuId: String): Resource<String> {
        return menuRepository.deleteMenuItem(menuId)
    }
}

