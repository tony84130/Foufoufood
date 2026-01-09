package com.example.foufoufood4.data.model.response
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.model.User

import com.google.gson.annotations.SerializedName

data class CreateRestaurantAdminData(
    val restaurant: Restaurant,
    val admin: User
)

data class CreateRestaurantAdminResponse(
    val success: Boolean,
    val message: String,
    @SerializedName("data")
    val data: CreateRestaurantAdminData
)

