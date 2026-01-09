package com.example.foufoufood4.data.model

import com.google.gson.annotations.SerializedName

/**
 * Modèle représentant une adresse utilisateur.
 */
data class Address(
    @SerializedName("line1")
    val line1: String? = null,
    
    @SerializedName("line2")
    val line2: String? = null,
    
    @SerializedName("city")
    val city: String? = null,
    
    @SerializedName("region")
    val region: String? = null,
    
    @SerializedName("postalCode")
    val postalCode: String? = null,
    
    @SerializedName("country")
    val country: String? = null
) {
    /**
     * Retourne une représentation textuelle complète de l'adresse.
     */
    fun getFullAddress(): String {
        val parts = mutableListOf<String>()
        line1?.let { if (it.isNotBlank()) parts.add(it) }
        line2?.let { if (it.isNotBlank()) parts.add(it) }
        city?.let { if (it.isNotBlank()) parts.add(it) }
        region?.let { if (it.isNotBlank()) parts.add(it) }
        postalCode?.let { if (it.isNotBlank()) parts.add(it) }
        country?.let { if (it.isNotBlank()) parts.add(it) }
        
        return if (parts.isEmpty()) "Aucune adresse" else parts.joinToString(", ")
    }
}

