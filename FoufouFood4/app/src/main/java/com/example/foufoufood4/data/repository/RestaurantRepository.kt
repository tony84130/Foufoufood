package com.example.foufoufood4.data.repository

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.request.restaurant.CreateRestaurantRequest
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.model.request.restaurant.UpdateRestaurantRequest
import com.example.foufoufood4.data.model.request.restaurant.AddReviewRequest
import com.example.foufoufood4.data.model.response.SimpleApiResponse
import com.example.foufoufood4.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RestaurantRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    /**
     * Récupère la liste de tous les restaurants.
     */
    suspend fun getRestaurants(): Resource<List<Restaurant>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getRestaurants()
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    // Extraire la liste du wrapper { success, data }
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la connexion: ${e.message}", e)
            }
        }
    }

    /**
     * Récupère les restaurants de l'utilisateur actuel (pour restaurant_admin).
     */
    suspend fun getMyRestaurants(): Resource<List<Restaurant>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val response = apiService.getMyRestaurants("Bearer $token")
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la connexion: ${e.message}", e)
            }
        }
    }

    /**
     * Récupère les informations d'un restaurant spécifique par son ID.
     */
    suspend fun getRestaurantById(restaurantId: String): Resource<Restaurant> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getRestaurantById(restaurantId)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la connexion: ${e.message}", e)
            }
        }
    }

    /**
     * Récupère le menu d'un restaurant spécifique.
     */
    suspend fun getRestaurantMenu(restaurantId: String): Resource<List<Menu>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getRestaurantMenu(restaurantId)
                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    // Extraire la liste du wrapper { success, data }
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la connexion: ${e.message}", e)
            }
        }
    }

    /**
     * Crée un nouveau restaurant.
     */
    suspend fun createRestaurant(
        name: String,
        address: String,
        cuisineType: String? = null,
        phone: String? = null,
        openingHours: List<com.example.foufoufood4.data.model.OpeningHours>? = null
    ): Resource<Restaurant> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val request = CreateRestaurantRequest(
                    name = name,
                    address = address,
                    cuisineType = cuisineType,
                    phone = phone,
                    openingHours = openingHours
                )
                val response = apiService.createRestaurant(request, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la création du restaurant: ${e.message}", e)
            }
        }
    }

    /**
     * Met à jour un restaurant.
     */
    suspend fun updateRestaurant(
        restaurantId: String,
        name: String?,
        address: String?,
        cuisineType: String? = null,
        phone: String? = null,
        openingHours: List<com.example.foufoufood4.data.model.OpeningHours>? = null,
        rating: Double? = null
    ): Resource<Restaurant> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val request = UpdateRestaurantRequest(
                    name = name,
                    address = address,
                    cuisineType = cuisineType,
                    phone = phone,
                    openingHours = openingHours,
                    rating = rating
                )
                val response = apiService.updateRestaurant(restaurantId, request, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la mise à jour du restaurant: ${e.message}", e)
            }
        }
    }

    /**
     * Supprime un restaurant.
     */
    suspend fun deleteRestaurant(restaurantId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val response = apiService.deleteRestaurant(restaurantId, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.message)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la suppression du restaurant: ${e.message}", e)
            }
        }
    }

    /**
     * Recherche des restaurants.
     */
    suspend fun searchRestaurants(query: String): Resource<List<Restaurant>> {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.searchRestaurants(query)
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

    /**
     * Ajoute ou met à jour un avis pour un restaurant.
     */
    suspend fun addRestaurantReview(
        restaurantId: String,
        rating: Int,
        comment: String? = null
    ): Resource<Restaurant> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val request = AddReviewRequest(
                    rating = rating,
                    comment = comment
                )
                
                android.util.Log.d("RestaurantRepository", "Adding review - restaurantId: $restaurantId, rating: $rating, comment: $comment")
                
                val response = apiService.addRestaurantReview(restaurantId, request, "Bearer $token")

                android.util.Log.d("RestaurantRepository", "Response code: ${response.code()}, isSuccessful: ${response.isSuccessful}")

                if (response.isSuccessful) {
                    val apiResponse = response.body()
                    if (apiResponse != null) {
                        android.util.Log.d("RestaurantRepository", "Review added successfully")
                        Resource.Success(apiResponse.data)
                    } else {
                        android.util.Log.e("RestaurantRepository", "Response body is null despite successful response")
                        Resource.Error("Réponse invalide du serveur")
                    }
                } else {
                    val errorMessage = try {
                        val errorBody = response.errorBody()?.string()
                        android.util.Log.e("RestaurantRepository", "Error response body: $errorBody")
                        errorBody ?: response.message() ?: "Erreur lors de l'ajout de l'avis"
                    } catch (e: Exception) {
                        android.util.Log.e("RestaurantRepository", "Error reading error body: ${e.message}", e)
                        response.message() ?: "Erreur lors de l'ajout de l'avis"
                    }
                    Resource.Error("Erreur: ${response.code()} - $errorMessage")
                }
            } catch (e: Exception) {
                android.util.Log.e("RestaurantRepository", "Exception in addRestaurantReview: ${e.message}", e)
                android.util.Log.e("RestaurantRepository", "Exception type: ${e.javaClass.simpleName}")
                val errorMessage = when {
                    e.message?.contains("Unable to resolve host", ignoreCase = true) == true ->
                        "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
                    e.message?.contains("timeout", ignoreCase = true) == true ->
                        "La connexion a expiré. Veuillez réessayer."
                    e.message?.contains("JSON", ignoreCase = true) == true ->
                        "Erreur de format de données. Veuillez réessayer."
                    else -> "Échec de l'ajout de l'avis: ${e.message ?: "Erreur inconnue"}"
                }
                Resource.Error(errorMessage, e)
            }
        }
    }

    /**
     * Supprime un avis d'un restaurant.
     */
    suspend fun deleteRestaurantReview(restaurantId: String): Resource<Restaurant> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val response = apiService.deleteRestaurantReview(restaurantId, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val apiResponse = response.body()!!
                    Resource.Success(apiResponse.data)
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMessage = errorBody ?: response.message() ?: "Erreur lors de la suppression de l'avis"
                    Resource.Error("Erreur: ${response.code()} - $errorMessage")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la suppression de l'avis: ${e.message}", e)
            }
        }
    }
}

