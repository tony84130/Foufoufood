package com.example.foufoufood4.data.model

import com.google.gson.annotations.SerializedName

data class Menu(
    @SerializedName("id")
    val id: String,

    val name: String,
    val description: String,
    val price: Double,
    val category: String,

    // On utilise @SerializedName pour faire le lien entre "image" (serveur)
    // et "imageUrl" (plus clair en Kotlin)
    @SerializedName("image")
    val imageUrl: String? = null
)