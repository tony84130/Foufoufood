package com.example.foufoufood4.data.model

import com.google.gson.annotations.SerializedName
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import java.lang.reflect.Type

data class Review(
    val user: String?, // User ID (peut être une string ou extrait d'un objet)
    val userName: String? = null, // Nom de l'utilisateur (si disponible après populate)
    val rating: Int?, // Note de 1 à 5
    val comment: String?,
    val createdAt: String?,
    val updatedAt: String?
)

// Deserializer personnalisé pour Review qui gère le cas où user peut être un String ou un objet
class ReviewDeserializer : JsonDeserializer<Review> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): Review? {
        if (json == null || !json.isJsonObject) return null
        
        val jsonObject = json.asJsonObject
        
        // Extraire l'ID utilisateur et le nom peu importe le format
        val userElement = jsonObject.get("user")
        val userId: String?
        val userName: String?
        
        when {
            userElement == null -> {
                userId = null
                userName = null
            }
            userElement.isJsonPrimitive && userElement.asJsonPrimitive.isString -> {
                userId = userElement.asString
                userName = null
            }
            userElement.isJsonObject -> {
                val userObj = userElement.asJsonObject
                // Mongoose peut renvoyer _id ou id selon la configuration
                userId = userObj.get("id")?.asString 
                    ?: userObj.get("_id")?.asString
                    ?: null
                userName = userObj.get("name")?.asString
                // Debug log pour voir ce qui est dans l'objet user
                android.util.Log.d("ReviewDeserializer", "User object keys: ${userObj.keySet()}")
                android.util.Log.d("ReviewDeserializer", "User object found - id: $userId, name: $userName")
            }
            else -> {
                userId = null
                userName = null
            }
        }
        
        android.util.Log.d("ReviewDeserializer", "Deserialized Review - userId: $userId, userName: $userName, rating: ${jsonObject.get("rating")?.asInt}")
        
        return Review(
            user = userId,
            userName = userName,
            rating = jsonObject.get("rating")?.asInt,
            comment = jsonObject.get("comment")?.asString,
            createdAt = jsonObject.get("createdAt")?.asString,
            updatedAt = jsonObject.get("updatedAt")?.asString
        )
    }
}


data class Restaurant(
    @SerializedName("id")
    val id: String,
    val name: String,
    val address: String,
    
    @SerializedName("cuisine")
    val cuisineType: String?,
    
    val phone: String?,
    val openingHours: List<OpeningHours>?,
    val rating: Double?,
    val reviews: List<Review>?,
    
    // Pour affichage dans la liste
    val price: Double = 12.99 // Valeur par défaut pour l'instant
) {
    fun getRatingDisplay(): String {
        return if (rating != null && rating > 0) {
            "★ ${String.format("%.1f", rating)}"
        } else {
            "Pas encore noté"
        }
    }

    fun getRating(): Float {
        // Retourne la note moyenne ou 0.0f si aucune note n'est disponible.
        return rating?.toFloat() ?: 0.0f
    }

    fun getReviewCount(): Int {
        return reviews?.size ?: 0
    }

    fun getCuisineDisplay(): String {
        return cuisineType ?: "Non spécifié"
    }

    fun getPhoneDisplay(): String {
        return phone ?: "Non renseigné"
    }
}