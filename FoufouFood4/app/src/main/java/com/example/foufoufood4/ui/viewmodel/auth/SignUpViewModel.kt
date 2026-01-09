package com.example.foufoufood4.ui.viewmodel.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.domain.usecase.auth.SignUpUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * État de l'interface utilisateur pour l'écran d'inscription.
 */
data class SignUpState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class SignUpViewModel @Inject constructor(
    private val signUpUseCase: SignUpUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(SignUpState())
    val uiState: StateFlow<SignUpState> = _uiState.asStateFlow()

    /**
     * Effectue l'inscription d'un nouvel utilisateur via le use case.
     */
    fun signUp(
        name: String,
        email: String,
        password: String,
        role: String,
        phone: String? = null,
        addressLine1: String? = null,
        addressLine2: String? = null,
        addressCity: String? = null,
        addressRegion: String? = null,
        addressPostalCode: String? = null,
        addressCountry: String? = null
    ) {
        viewModelScope.launch {
            _uiState.value = SignUpState(isLoading = true)

            // Normaliser l'email en minuscules
            val normalizedEmail = email.trim().lowercase()

            when (val result = signUpUseCase(
                name = name,
                email = normalizedEmail,
                password = password,
                confirmPassword = password, // Validation déjà faite dans l'UI
                role = role,
                phone = phone,
                addressLine1 = addressLine1,
                addressLine2 = addressLine2,
                addressCity = addressCity,
                addressRegion = addressRegion,
                addressPostalCode = addressPostalCode,
                addressCountry = addressCountry
            )) {
                is Resource.Success -> {
                    _uiState.value = SignUpState(isSuccess = true)
                }
                is Resource.Error -> {
                    _uiState.value = SignUpState(errorMessage = result.message)
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
        _uiState.value = SignUpState()
    }
}

