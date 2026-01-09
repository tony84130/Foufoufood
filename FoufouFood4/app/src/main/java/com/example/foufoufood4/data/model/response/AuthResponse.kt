package com.example.foufoufood4.data.model.response
import com.example.foufoufood4.data.model.User

import com.google.gson.annotations.SerializedName

// Ce modèle représente l'objet "user" dans la réponse
data class UserInfo(
    val id: String, // Le serveur renvoie "id" et non "_id" (virtuals de Mongoose)
    val name: String,
    val email: String,
    val role: String // Le rôle est bien envoyé par le serveur (toJSON de Mongoose)
)

// Ce modèle représente l'objet "data"
data class AuthData(
    val token: String,
    val user: UserInfo
)

// Ce modèle représente la réponse complète du serveur
data class AuthResponse(
    val success: Boolean,
    val message: String,
    val data: AuthData
)