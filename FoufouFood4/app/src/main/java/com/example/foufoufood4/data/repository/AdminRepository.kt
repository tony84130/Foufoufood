package com.example.foufoufood4.data.repository

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.data.model.request.admin.CreateRestaurantAdminRequest
import com.example.foufoufood4.data.model.response.CreateRestaurantAdminResponse
import com.example.foufoufood4.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdminRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    /**
     * Récupère tous les utilisateurs (clients, livreurs, admins).
     */
    suspend fun getAllUsers(): Resource<List<User>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val response = apiService.getAllUsers("Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val usersResponse = response.body()!!
                    Resource.Success(usersResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la récupération des utilisateurs: ${e.message}", e)
            }
        }
    }

    /**
     * Supprime un utilisateur par son ID.
     */
    suspend fun deleteUser(userId: String): Resource<String> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val response = apiService.deleteUserById(userId, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val deleteResponse = response.body()!!
                    Resource.Success(deleteResponse.message)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la suppression de l'utilisateur: ${e.message}", e)
            }
        }
    }

    /**
     * Crée un restaurant avec son administrateur.
     */
    suspend fun createRestaurantWithAdmin(
        restaurantName: String,
        restaurantAddress: String,
        adminName: String,
        adminEmail: String,
        adminPassword: String
    ): Resource<CreateRestaurantAdminResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()

                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }

                val request = CreateRestaurantAdminRequest(
                    restaurantName = restaurantName,
                    restaurantAddress = restaurantAddress,
                    adminName = adminName,
                    adminEmail = adminEmail,
                    adminPassword = adminPassword
                )

                val response = apiService.createRestaurantWithAdmin(request, "Bearer $token")

                if (response.isSuccessful && response.body() != null) {
                    val createResponse = response.body()!!
                    return@withContext Resource.Success(createResponse.data) as Resource<CreateRestaurantAdminResponse>
                }
                
                // Gestion des erreurs
                val errorBody = response.errorBody()?.string()
                
                // Parser le message d'erreur JSON
                val errorMessage: String = try {
                    if (errorBody != null) {
                        // Le serveur renvoie un JSON avec un champ "message"
                        val regex = "\"message\"\\s*:\\s*\"([^\"]+)\"".toRegex()
                        regex.find(errorBody)?.groupValues?.get(1) ?: errorBody
                    } else {
                        response.message()
                    }
                } catch (e: Exception) {
                    errorBody ?: response.message()
                }
                
                return@withContext Resource.Error(errorMessage) as Resource<CreateRestaurantAdminResponse>
            } catch (e: Exception) {
                return@withContext Resource.Error("Échec de la création du restaurant: ${e.message}", e)
            }
        }
    }
}

