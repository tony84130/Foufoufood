package com.example.foufoufood4.data.model.request.restaurant

data class AddReviewRequest(
    val rating: Int,
    val comment: String? = null
)

