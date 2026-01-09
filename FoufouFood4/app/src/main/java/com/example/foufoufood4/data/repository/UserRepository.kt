package com.example.foufoufood4.data.repository

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.request.user.UpdateUserRequest
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    /**
     * Récupère les informations de l'utilisateur actuellement connecté.
     */
    suspend fun getCurrentUser(): Resource<User> {
        return withContext(Dispatchers.IO) {
            try {
                val userId = sessionManager.getUserId()
                val token = sessionManager.fetchAuthToken()
                
                // Logs de debugging
                android.util.Log.d("UserRepository", "getUserId: $userId")
                android.util.Log.d("UserRepository", "Token présent: ${token != null}")
                android.util.Log.d("UserRepository", "Token value: ${token?.take(20)}...")
                
                if (userId == null) {
                    android.util.Log.e("UserRepository", "userId est null")
                    return@withContext Resource.Error("Utilisateur non connecté - ID utilisateur manquant")
                }
                
                if (token == null) {
                    android.util.Log.e("UserRepository", "Token est null")
                    return@withContext Resource.Error("Utilisateur non connecté - Token manquant")
                }
                
                val authHeader = "Bearer $token"
                android.util.Log.d("UserRepository", "Auth header: ${authHeader.take(30)}...")
                
                val response = apiService.getUserById(userId, authHeader)
                
                android.util.Log.d("UserRepository", "Response code: ${response.code()}")
                android.util.Log.d("UserRepository", "Response successful: ${response.isSuccessful}")
                
                if (response.isSuccessful && response.body() != null) {
                    val userResponse = response.body()!!
                    android.util.Log.d("UserRepository", "User data retrieved: ${userResponse.data.name}")
                    Resource.Success(userResponse.data)
                } else {
                    val errorBody = response.errorBody()?.string()
                    android.util.Log.e("UserRepository", "Error response: $errorBody")
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("UserRepository", "Exception: ${e.message}", e)
                Resource.Error("Échec de la récupération du profil: ${e.message}", e)
            }
        }
    }
    
    /**
     * Récupère les informations d'un utilisateur par son ID.
     */
    suspend fun getUserById(userId: String): Resource<User> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()
                
                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }
                
                val response = apiService.getUserById(userId, "Bearer $token")
                
                if (response.isSuccessful && response.body() != null) {
                    val userResponse = response.body()!!
                    Resource.Success(userResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la récupération du profil: ${e.message}", e)
            }
        }
    }
    
    /**
     * Met à jour les informations de l'utilisateur actuellement connecté.
     */
    suspend fun updateCurrentUser(request: UpdateUserRequest): Resource<User> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()
                
                android.util.Log.d("UserRepository", "=== Updating user profile ===")
                android.util.Log.d("UserRepository", "Token available: ${token != null}")
                
                if (token == null) {
                    android.util.Log.e("UserRepository", "Token est null")
                    return@withContext Resource.Error("Utilisateur non connecté - Token manquant")
                }
                
                val authHeader = "Bearer $token"
                val response = apiService.updateCurrentUser(request, authHeader)
                
                android.util.Log.d("UserRepository", "Update response code: ${response.code()}")
                android.util.Log.d("UserRepository", "Update response successful: ${response.isSuccessful}")
                
                if (response.isSuccessful && response.body() != null) {
                    val userResponse = response.body()!!
                    android.util.Log.d("UserRepository", "User profile updated: ${userResponse.data.name}")
                    
                    // Mettre à jour les infos de session si le nom ou l'email ont changé
                    request.name?.let { sessionManager.saveAuthToken(
                        token = token,
                        userId = sessionManager.getUserId() ?: "",
                        userName = it,
                        userEmail = request.email ?: sessionManager.getUserEmail() ?: ""
                    )}
                    
                    Resource.Success(userResponse.data)
                } else {
                    val errorBody = response.errorBody()?.string()
                    android.util.Log.e("UserRepository", "Update error response: $errorBody")
                    Resource.Error("Erreur de mise à jour: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("UserRepository", "Update exception: ${e.message}", e)
                Resource.Error("Échec de la mise à jour du profil: ${e.message}", e)
            }
        }
    }
    
    /**
     * Supprime le compte de l'utilisateur actuellement connecté.
     */
    suspend fun deleteCurrentUser(): Resource<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()
                
                android.util.Log.d("UserRepository", "=== Deleting user account ===")
                android.util.Log.d("UserRepository", "Token available: ${token != null}")
                
                if (token == null) {
                    android.util.Log.e("UserRepository", "Token est null")
                    return@withContext Resource.Error("Utilisateur non connecté - Token manquant")
                }
                
                val authHeader = "Bearer $token"
                val response = apiService.deleteCurrentUser(authHeader)
                
                android.util.Log.d("UserRepository", "Delete response code: ${response.code()}")
                android.util.Log.d("UserRepository", "Delete response successful: ${response.isSuccessful}")
                
                if (response.isSuccessful && response.body() != null) {
                    val deleteResponse = response.body()!!
                    android.util.Log.d("UserRepository", "User account deleted: ${deleteResponse.message}")
                    
                    // Effacer la session locale après suppression
                    sessionManager.clearAuthToken()
                    
                    Resource.Success(Unit)
                } else {
                    val errorBody = response.errorBody()?.string()
                    android.util.Log.e("UserRepository", "Delete error response: $errorBody")
                    Resource.Error("Erreur de suppression: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("UserRepository", "Delete exception: ${e.message}", e)
                Resource.Error("Échec de la suppression du compte: ${e.message}", e)
            }
        }
    }

    /**
     * Recherche des utilisateurs (platform_admin seulement).
     */
    suspend fun searchUsers(query: String): Resource<List<User>> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()
                
                if (token == null) {
                    return@withContext Resource.Error("Token non disponible")
                }
                
                val response = apiService.searchUsers(query, "Bearer $token")
                
                if (response.isSuccessful && response.body() != null) {
                    val usersResponse = response.body()!!
                    Resource.Success(usersResponse.data)
                } else {
                    Resource.Error("Erreur: ${response.code()} - ${response.message()}")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la recherche: ${e.message}", e)
            }
        }
    }
}

