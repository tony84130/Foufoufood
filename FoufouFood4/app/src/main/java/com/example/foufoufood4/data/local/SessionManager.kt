package com.example.foufoufood4.data.local

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionManager @Inject constructor(@ApplicationContext context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("FoufoodAppPrefs", Context.MODE_PRIVATE)

    companion object {
        const val USER_TOKEN = "user_token"
        const val USER_ID = "user_id"
        const val USER_NAME = "user_name"
        const val USER_EMAIL = "user_email"
        const val USER_ROLE = "user_role"
    }

    /**
     * Sauvegarde le token d'authentification et les informations de l'utilisateur.
     */
    fun saveAuthToken(token: String, userId: String? = null, userName: String? = null, userEmail: String? = null, userRole: String? = null) {
        val editor = prefs.edit()
        editor.putString(USER_TOKEN, token)
        userId?.let { editor.putString(USER_ID, it) }
        userName?.let { editor.putString(USER_NAME, it) }
        userEmail?.let { editor.putString(USER_EMAIL, it) }
        userRole?.let { editor.putString(USER_ROLE, it) }
        editor.apply()
    }

    /**
     * Récupère le token d'authentification.
     * Retourne null si le token n'est pas trouvé.
     */
    fun fetchAuthToken(): String? {
        return prefs.getString(USER_TOKEN, null)
    }

    /**
     * Récupère l'ID de l'utilisateur connecté.
     */
    fun getUserId(): String? {
        return prefs.getString(USER_ID, null)
    }

    /**
     * Récupère le nom de l'utilisateur connecté.
     */
    fun getUserName(): String? {
        return prefs.getString(USER_NAME, null)
    }

    /**
     * Récupère l'email de l'utilisateur connecté.
     */
    fun getUserEmail(): String? {
        return prefs.getString(USER_EMAIL, null)
    }

    /**
     * Récupère le rôle de l'utilisateur connecté.
     */
    fun getUserRole(): String? {
        return prefs.getString(USER_ROLE, null)
    }

    /**
     * Supprime le token d'authentification et toutes les données utilisateur (logout).
     */
    fun clearAuthToken() {
        val editor = prefs.edit()
        editor.remove(USER_TOKEN)
        editor.remove(USER_ID)
        editor.remove(USER_NAME)
        editor.remove(USER_EMAIL)
        editor.remove(USER_ROLE)
        editor.apply()
    }

    /**
     * Vérifie si l'utilisateur est connecté.
     */
    fun isLoggedIn(): Boolean {
        return fetchAuthToken() != null && getUserId() != null
    }

    fun updateUserInfo(userId: String? = null, userName: String? = null, userEmail: String? = null, userRole: String? = null) {
        val editor = prefs.edit()
        userId?.let { editor.putString(USER_ID, it) }
        userName?.let { editor.putString(USER_NAME, it) }
        userEmail?.let { editor.putString(USER_EMAIL, it) }
        userRole?.let { editor.putString(USER_ROLE, it) }
        editor.apply()
    }
}

