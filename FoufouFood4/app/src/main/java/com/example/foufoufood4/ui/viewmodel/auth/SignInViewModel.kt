package com.example.foufoufood4.ui.viewmodel.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.domain.usecase.auth.SignInUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * État de l'interface utilisateur pour l'écran de connexion.
 */
data class SignInState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class SignInViewModel @Inject constructor(
    private val signInUseCase: SignInUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignInState())
    val uiState: StateFlow<SignInState> = _uiState.asStateFlow()

    /**
     * Effectue la connexion d'un utilisateur via le use case.
     */
    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = SignInState(isLoading = true)

            // Normaliser l'email en minuscules
            val normalizedEmail = email.trim().lowercase()

            when (val result = signInUseCase(normalizedEmail, password)) {
                is Resource.Success -> {
                    _uiState.value = SignInState(isSuccess = true)
                }
                is Resource.Error -> {
                    _uiState.value = SignInState(errorMessage = result.message)
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }

    /**
     * Réinitialise l'état de l'interface utilisateur.
     */
    fun resetState() {
        _uiState.value = SignInState()
    }
}