package com.example.foufoufood4.data.model.response

import com.google.gson.annotations.SerializedName

data class PendingNotificationResponse(
    @SerializedName("hasNewOrderNotification")
    val hasNewOrderNotification: Boolean, // C'est la valeur qui nous intéresse pour le badge
    @SerializedName("count")
    val count: Int
)