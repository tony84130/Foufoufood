package com.example.foufoufood4.data.model.response

import com.example.foufoufood4.data.model.User

// Réponse du serveur contenant un utilisateur
data class UserResponse(
    val success: Boolean,
    val message: String,
    val data: User
)


