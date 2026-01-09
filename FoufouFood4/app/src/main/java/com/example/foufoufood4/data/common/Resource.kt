package com.example.foufoufood4.data.common

/**
 * Wrapper pour encapsuler les résultats d'opérations asynchrones
 * avec gestion des états de chargement, succès et erreur.
 */
sealed class Resource<out T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val message: String, val exception: Throwable? = null) : Resource<Nothing>()
    object Loading : Resource<Nothing>()

    /**
     * Retourne true si le résultat est un succès.
     */
    fun isSuccess(): Boolean = this is Success

    /**
     * Retourne true si le résultat est une erreur.
     */
    fun isError(): Boolean = this is Error

    /**
     * Retourne true si le résultat est en cours de chargement.
     */
    fun isLoading(): Boolean = this is Loading

    /**
     * Retourne les données si succès, sinon null.
     */
    fun getDataOrNull(): T? = if (this is Success) data else null

    /**
     * Retourne le message d'erreur si erreur, sinon null.
     */
    fun getErrorMessageOrNull(): String? = if (this is Error) message else null
}

