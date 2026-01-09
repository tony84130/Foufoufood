package com.example.foufoufood4.data.model.request.restaurant
import com.example.foufoufood4.data.model.Address
import com.example.foufoufood4.data.model.OpeningHours

import com.google.gson.annotations.SerializedName

data class CreateRestaurantRequest(
    val name: String,
    val address: String,
    @SerializedName("cuisine")
    val cuisineType: String? = null,
    val phone: String? = null,
    val openingHours: List<OpeningHours>? = null
)

