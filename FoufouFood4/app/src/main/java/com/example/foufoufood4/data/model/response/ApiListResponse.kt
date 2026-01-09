package com.example.foufoufood4.data.model.response

/**
 * Wrapper générique pour les réponses API qui retournent une liste
 * Format serveur: { "success": true, "data": [...] }
 */
data class ApiListResponse<T>(
    val success: Boolean,
    val data: List<T>
)

