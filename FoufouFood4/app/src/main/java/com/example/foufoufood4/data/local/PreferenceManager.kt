package com.example.foufoufood4.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PreferenceManager @Inject constructor(@ApplicationContext context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("foufoufood_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_FAVORITE_RESTAURANTS_PREFIX = "favorite_restaurants_"
    }

    /**
     * Sauvegarde les IDs des restaurants favoris pour l'utilisateur actuel.
     * @param userId L'ID de l'utilisateur actuel (null si non connecté)
     * @param ids L'ensemble des IDs de restaurants favoris
     */
    fun saveFavoriteRestaurantIds(userId: String?, ids: Set<String>) {
        if (userId == null) {
            Log.w("PreferenceManager", "saveFavoriteRestaurantIds - userId is null, cannot save")
            return
        }
        val key = "$KEY_FAVORITE_RESTAURANTS_PREFIX$userId"
        // Créer une copie défensive pour éviter les problèmes de mutation
        val idsCopy = HashSet(ids)
        Log.d("PreferenceManager", "saveFavoriteRestaurantIds - userId: $userId, key: $key, ids: $idsCopy")
        // Utiliser commit() au lieu de apply() pour garantir la persistance immédiate
        val success = prefs.edit().putStringSet(key, idsCopy).commit()
        Log.d("PreferenceManager", "saveFavoriteRestaurantIds - Commit success: $success")
        
        // Vérification immédiate
        val verification = prefs.getStringSet(key, null)
        Log.d("PreferenceManager", "saveFavoriteRestaurantIds - Verification after save: $verification")
    }

    /**
     * Charge les IDs des restaurants favoris pour l'utilisateur actuel.
     * @param userId L'ID de l'utilisateur actuel (null si non connecté)
     * @return L'ensemble des IDs de restaurants favoris pour cet utilisateur
     */
    fun loadFavoriteRestaurantIds(userId: String?): Set<String> {
        if (userId == null) {
            Log.w("PreferenceManager", "loadFavoriteRestaurantIds - userId is null, returning empty set")
            return emptySet()
        }
        val key = "$KEY_FAVORITE_RESTAURANTS_PREFIX$userId"
        val loadedSet = prefs.getStringSet(key, null)
        Log.d("PreferenceManager", "loadFavoriteRestaurantIds - userId: $userId, key: $key, loadedSet: $loadedSet")
        // Créer une copie défensive pour éviter les problèmes de mutation
        // et retourner un Set mutable qui peut être utilisé sans problème
        return if (loadedSet != null) {
            val result = HashSet(loadedSet)
            Log.d("PreferenceManager", "loadFavoriteRestaurantIds - Returning: $result")
            result
        } else {
            Log.d("PreferenceManager", "loadFavoriteRestaurantIds - No data found, returning empty set")
            emptySet()
        }
    }

    /**
     * Supprime les favoris d'un utilisateur lors de la déconnexion.
     * @param userId L'ID de l'utilisateur qui se déconnecte
     */
    fun clearFavoriteRestaurantIds(userId: String?) {
        if (userId == null) {
            return
        }
        val key = "$KEY_FAVORITE_RESTAURANTS_PREFIX$userId"
        prefs.edit().remove(key).commit()
    }

    /**
     * Méthode de débogage : Liste toutes les clés de favoris stockées.
     */
    fun getAllFavoriteKeys(): Set<String> {
        val allKeys = prefs.all.keys
        val favoriteKeys = allKeys.filter { it.startsWith(KEY_FAVORITE_RESTAURANTS_PREFIX) }
        Log.d("PreferenceManager", "getAllFavoriteKeys - Found keys: $favoriteKeys")
        return favoriteKeys.toSet()
    }

    /**
     * Méthode de débogage : Vérifie toutes les données de favoris stockées.
     */
    fun debugAllFavorites() {
        val allKeys = prefs.all.keys
        Log.d("PreferenceManager", "debugAllFavorites - All keys in SharedPreferences: $allKeys")
        val favoriteKeys = allKeys.filter { it.startsWith(KEY_FAVORITE_RESTAURANTS_PREFIX) }
        favoriteKeys.forEach { key ->
            val value = prefs.getStringSet(key, null)
            Log.d("PreferenceManager", "debugAllFavorites - Key: $key, Value: $value")
        }
    }
}