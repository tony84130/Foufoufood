package com.example.foufoufood4.data.repository

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.response.AuthResponse
import com.example.foufoufood4.data.model.Address
import com.example.foufoufood4.data.model.request.auth.SignInRequest
import com.example.foufoufood4.data.model.request.auth.SignUpRequest
import com.example.foufoufood4.data.remote.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    /**
     * Enregistre un nouvel utilisateur.
     */
    suspend fun signUp(
        name: String,
        email: String,
        password: String,
        role: String,
        phone: String? = null,
        addressLine1: String? = null,
        addressLine2: String? = null,
        addressCity: String? = null,
        addressRegion: String? = null,
        addressPostalCode: String? = null,
        addressCountry: String? = null
    ): Resource<AuthResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val address = if (addressLine1 != null || addressLine2 != null || addressCity != null 
                    || addressRegion != null || addressPostalCode != null || addressCountry != null) {
                    Address(
                        line1 = addressLine1,
                        line2 = addressLine2,
                        city = addressCity,
                        region = addressRegion,
                        postalCode = addressPostalCode,
                        country = addressCountry
                    )
                } else null
                
                val request = SignUpRequest(name, email, password, role, phone, address)
                val response = apiService.registerUser(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    
                    // Logs de debugging pour inscription
                    android.util.Log.d("AuthRepository", "SignUp successful - Saving token")
                    android.util.Log.d("AuthRepository", "User ID: ${authResponse.data.user.id}")
                    android.util.Log.d("AuthRepository", "User Name: ${authResponse.data.user.name}")
                    android.util.Log.d("AuthRepository", "Token présent: ${authResponse.data.token.isNotEmpty()}")
                    
                    sessionManager.saveAuthToken(
                        token = authResponse.data.token,
                        userId = authResponse.data.user.id,
                        userName = authResponse.data.user.name,
                        userEmail = authResponse.data.user.email,
                        userRole = authResponse.data.user.role
                    )
                    
                    // Vérification après sauvegarde
                    android.util.Log.d("AuthRepository", "Vérification - Token sauvegardé: ${sessionManager.fetchAuthToken() != null}")
                    android.util.Log.d("AuthRepository", "Vérification - UserId sauvegardé: ${sessionManager.getUserId()}")
                    
                    Resource.Success(authResponse)
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Erreur inconnue"
                    android.util.Log.e("AuthRepository", "SignUp failed: $errorBody")
                    Resource.Error("Erreur d'inscription: $errorBody")
                }
            } catch (e: Exception) {
                Resource.Error("Échec de la connexion: ${e.message}", e)
            }
        }
    }

    /**
     * Connecte un utilisateur existant.
     */
    suspend fun signIn(email: String, password: String): Resource<AuthResponse> {
        return withContext(Dispatchers.IO) {
            try {
                val request = SignInRequest(email, password)
                val response = apiService.signInUser(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    
                    // Logs de debugging pour connexion
                    android.util.Log.d("AuthRepository", "SignIn successful - Saving token")
                    android.util.Log.d("AuthRepository", "User ID: ${authResponse.data.user.id}")
                    android.util.Log.d("AuthRepository", "User Name: ${authResponse.data.user.name}")
                    android.util.Log.d("AuthRepository", "Token présent: ${authResponse.data.token.isNotEmpty()}")
                    
                    sessionManager.saveAuthToken(
                        token = authResponse.data.token,
                        userId = authResponse.data.user.id,
                        userName = authResponse.data.user.name,
                        userEmail = authResponse.data.user.email,
                        userRole = authResponse.data.user.role
                    )
                    
                    // Vérification après sauvegarde
                    android.util.Log.d("AuthRepository", "Vérification - Token sauvegardé: ${sessionManager.fetchAuthToken() != null}")
                    android.util.Log.d("AuthRepository", "Vérification - UserId sauvegardé: ${sessionManager.getUserId()}")
                    
                    Resource.Success(authResponse)
                } else {
                    val errorBody = response.errorBody()?.string() ?: "Erreur inconnue"
                    android.util.Log.e("AuthRepository", "SignIn failed: $errorBody")
                    
                    // Parser le message d'erreur pour fournir un message plus clair
                    val errorMessage = when {
                        errorBody.contains("User not found", ignoreCase = true) -> 
                            "Aucun compte trouvé avec cet email"
                        errorBody.contains("Invalid password", ignoreCase = true) -> 
                            "Mot de passe incorrect"
                        errorBody.contains("already logged in", ignoreCase = true) -> 
                            "Vous êtes déjà connecté. Veuillez vous déconnecter d'abord."
                        else -> "Erreur de connexion : ${response.message()}"
                    }
                    Resource.Error(errorMessage)
                }
            } catch (e: Exception) {
                val errorMessage = when {
                    e.message?.contains("Unable to resolve host", ignoreCase = true) == true ->
                        "Impossible de se connecter au serveur. Vérifiez votre connexion internet."
                    e.message?.contains("timeout", ignoreCase = true) == true ->
                        "La connexion a expiré. Veuillez réessayer."
                    else -> "Échec de la connexion: ${e.message}"
                }
                Resource.Error(errorMessage, e)
            }
        }
    }

    /**
     * Déconnecte l'utilisateur et invalide la session côté serveur.
     */
    suspend fun signOut(): Resource<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val token = sessionManager.fetchAuthToken()
                
                if (token != null) {
                    android.util.Log.d("AuthRepository", "SignOut - Calling server to invalidate session")
                    
                    val response = apiService.signOut("Bearer $token")
                    
                    if (response.isSuccessful) {
                        android.util.Log.d("AuthRepository", "SignOut - Server session invalidated successfully")
                        sessionManager.clearAuthToken()
                        Resource.Success(Unit)
                    } else {
                        val errorBody = response.errorBody()?.string() ?: "Erreur inconnue"
                        android.util.Log.e("AuthRepository", "SignOut failed on server: $errorBody")
                        // On efface quand même la session locale même si le serveur échoue
                        sessionManager.clearAuthToken()
                        Resource.Error("Erreur lors de la déconnexion: $errorBody")
                    }
                } else {
                    android.util.Log.d("AuthRepository", "SignOut - No token found, clearing local session only")
                    sessionManager.clearAuthToken()
                    Resource.Success(Unit)
                }
            } catch (e: Exception) {
                android.util.Log.e("AuthRepository", "SignOut exception: ${e.message}", e)
                // En cas d'erreur réseau, on efface quand même la session locale
                sessionManager.clearAuthToken()
                Resource.Error("Échec de la déconnexion: ${e.message}", e)
            }
        }
    }
}

