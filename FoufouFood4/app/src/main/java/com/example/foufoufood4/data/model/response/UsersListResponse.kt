package com.example.foufoufood4.data.model.response
import com.example.foufoufood4.data.model.User

import com.google.gson.annotations.SerializedName

/**
 * Réponse pour la liste des utilisateurs.
 */
data class UsersListResponse(
    val success: Boolean,
    @SerializedName("data")
    val data: List<User>
)

