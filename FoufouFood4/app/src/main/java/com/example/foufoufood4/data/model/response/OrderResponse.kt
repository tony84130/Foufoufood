package com.example.foufoufood4.data.model.response

import com.example.foufoufood4.data.model.Order

data class OrderResponse(
    val success: Boolean,
    val message: String? = null,
    val data: Order? = null
)
