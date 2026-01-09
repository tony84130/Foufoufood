package com.example.foufoufood4.data.model.response
import com.example.foufoufood4.data.model.Restaurant

import com.google.gson.annotations.SerializedName

data class RestaurantResponse(
    val success: Boolean,
    val message: String? = null,
    @SerializedName("data")
    val data: Restaurant
)

