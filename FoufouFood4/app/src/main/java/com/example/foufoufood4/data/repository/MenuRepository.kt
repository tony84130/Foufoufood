package com.example.foufoufood4.data.repository
import com.example.foufoufood4.data.model.response.SimpleApiResponse

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.request.menu.AddMenuItemRequest
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.request.menu.UpdateMenuItemRequest
import com.example.foufoufood4.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MenuRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    /**
     * Ajoute un menu à un restaurant.
     */
    suspend fun addMenuItem(
        restaurantId: String,
        name: String,
        description: String,
        price: Double,
        category: String,
        image: String? = null
    ): Resource<Menu> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val request = AddMenuItemRequest(
                    restaurantId = restaurantId,
                    name = name,
                    description = description,
                    price = price,
                    category = category,
                    image = image
                )
                val response = apiService.addMenuItem(request, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val SimpleApiResponse = response.body()!!
                    Resource.Success(SimpleApiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de l'ajout du menu: ${e.message}", e)
            }
        }
    }

    /**
     * Met à jour un menu.
     */
    suspend fun updateMenuItem(
        menuId: String,
        name: String?,
        description: String?,
        price: Double?,
        category: String?,
        image: String? = null
    ): Resource<Menu> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val request = UpdateMenuItemRequest(
                    name = name,
                    description = description,
                    price = price,
                    category = category,
                    image = image
                )
                val response = apiService.updateMenuItem(menuId, request, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val SimpleApiResponse = response.body()!!
                    Resource.Success(SimpleApiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la mise à jour du menu: ${e.message}", e)
            }
        }
    }

    /**
     * Supprime un menu.
     */
    suspend fun deleteMenuItem(menuId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val response = apiService.deleteMenuItem(menuId, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val SimpleApiResponse = response.body()!!
                    Resource.Success(SimpleApiResponse.message)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la suppression du menu: ${e.message}", e)
            }
        }
    }

    /**
     * Recherche des items de menu dans un restaurant.
     */
    suspend fun searchMenuItems(restaurantId: String, query: String): Resource<List<Menu>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.searchMenuItems(restaurantId, query)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la recherche: ${e.message}", e)
            }
        }
    }
}

