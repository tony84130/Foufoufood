package com.example.foufoufood4.data.model.response

/**
 * Réponse API simple sans données (juste success et message).
 * Utilisé pour les opérations qui ne retournent pas de données (suppression, etc.)
 */
data class SimpleApiResponse(
    val success: Boolean,
    val message: String
)

