package com.example.foufoufood4.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

// Extension pour créer le DataStore
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "favorites_prefs")

@Singleton
class FavoritesDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val KEY_PREFIX = "favorite_restaurants_"
    }

    /**
     * Sauvegarde les IDs des restaurants favoris pour l'utilisateur actuel.
     */
    suspend fun saveFavoriteRestaurantIds(userId: String?, ids: Set<String>) {
        if (userId == null) return
        
        val key = stringSetPreferencesKey("$KEY_PREFIX$userId")
        context.dataStore.edit { preferences ->
            preferences[key] = ids
        }
    }

    /**
     * Charge les IDs des restaurants favoris pour l'utilisateur actuel (Flow).
     */
    fun loadFavoriteRestaurantIds(userId: String?): Flow<Set<String>> {
        if (userId == null) {
            return kotlinx.coroutines.flow.flowOf(emptySet())
        }
        
        val key = stringSetPreferencesKey("$KEY_PREFIX$userId")
        return context.dataStore.data.map { preferences ->
            preferences[key] ?: emptySet()
        }
    }

    /**
     * Charge les IDs des restaurants favoris de manière synchrone (pour l'initialisation).
     */
    suspend fun loadFavoriteRestaurantIdsSync(userId: String?): Set<String> {
        if (userId == null) return emptySet()
        
        val key = stringSetPreferencesKey("$KEY_PREFIX$userId")
        return context.dataStore.data.map { preferences ->
            preferences[key] ?: emptySet()
        }.first()
    }

    /**
     * Supprime les favoris d'un utilisateur lors de la déconnexion.
     */
    suspend fun clearFavoriteRestaurantIds(userId: String?) {
        if (userId == null) return
        
        val key = stringSetPreferencesKey("$KEY_PREFIX$userId")
        context.dataStore.edit { preferences ->
            preferences.remove(key)
        }
    }
}

