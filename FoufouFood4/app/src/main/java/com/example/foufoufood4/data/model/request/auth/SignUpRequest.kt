package com.example.foufoufood4.data.model.request.auth
import com.example.foufoufood4.data.model.Address

data class SignUpRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String,
    val phone: String? = null,
    val address: Address? = null
)