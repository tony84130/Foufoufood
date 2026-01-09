package com.example.foufoufood4.ui.viewmodel.profile

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.domain.usecase.user.DeleteCurrentUserUseCase
import com.example.foufoufood4.domain.usecase.user.GetCurrentUserUseCase
import com.example.foufoufood4.domain.usecase.auth.SignOutUseCase
import com.example.foufoufood4.domain.usecase.user.UpdateUserProfileUseCase
import com.example.foufoufood4.data.model.Address
import com.example.foufoufood4.data.model.request.user.UpdateUserRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * État de l'interface utilisateur pour l'écran de profil.
 */
data class ProfileState(
    val user: User? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggingOut: Boolean = false,
    val logoutSuccess: Boolean = false,
    val isEditMode: Boolean = false,
    val isSaving: Boolean = false,
    val updateSuccess: Boolean = false,
    val isDeleting: Boolean = false,
    val deleteSuccess: Boolean = false,
    val showDeleteConfirmation: Boolean = false,
    // Champs éditables
    val editName: String = "",
    val editEmail: String = "",
    val editPhone: String = "",
    val editAddressLine1: String = "",
    val editAddressLine2: String = "",
    val editAddressCity: String = "",
    val editAddressRegion: String = "",
    val editAddressPostalCode: String = "",
    val editAddressCountry: String = "",
    // Champs pour le mot de passe
    val editPassword: String = "",
    val editPasswordConfirm: String = ""
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val signOutUseCase: SignOutUseCase,
    private val updateUserProfileUseCase: UpdateUserProfileUseCase,
    private val deleteCurrentUserUseCase: DeleteCurrentUserUseCase,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileState())
    val uiState: StateFlow<ProfileState> = _uiState.asStateFlow()

    init {
        fetchUserProfile()
    }

    /**
     * Récupère le profil de l'utilisateur connecté.
     */
    fun fetchUserProfile() {
        viewModelScope.launch {
            _uiState.value = ProfileState(isLoading = true)
            
            // Logs de debugging
            android.util.Log.d("ProfileViewModel", "=== Fetching user profile ===")
            android.util.Log.d("ProfileViewModel", "User ID from session: ${sessionManager.getUserId()}")
            android.util.Log.d("ProfileViewModel", "User Name from session: ${sessionManager.getUserName()}")
            android.util.Log.d("ProfileViewModel", "User Email from session: ${sessionManager.getUserEmail()}")
            android.util.Log.d("ProfileViewModel", "Token available: ${sessionManager.fetchAuthToken() != null}")
            android.util.Log.d("ProfileViewModel", "Is logged in: ${sessionManager.isLoggedIn()}")

            when (val result = getCurrentUserUseCase()) {
                is Resource.Success -> {
                    android.util.Log.d("ProfileViewModel", "Profile fetched successfully: ${result.data.name}")
                    _uiState.value = ProfileState(user = result.data)
                }
                is Resource.Error -> {
                    android.util.Log.e("ProfileViewModel", "Profile fetch error: ${result.message}")
                    _uiState.value = ProfileState(errorMessage = result.message)
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }

    /**
     * Déconnecte l'utilisateur et invalide la session côté serveur.
     */
    fun logout() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoggingOut = true)
            
            android.util.Log.d("ProfileViewModel", "=== Logging out ===")
            
            when (val result = signOutUseCase()) {
                is Resource.Success -> {
                    android.util.Log.d("ProfileViewModel", "Logout successful")
                    _uiState.value = ProfileState(
                        logoutSuccess = true,
                        isLoggingOut = false
                    )
                }
                is Resource.Error -> {
                    android.util.Log.e("ProfileViewModel", "Logout error: ${result.message}")
                    // Même si l'appel serveur échoue, on considère que la déconnexion locale a réussi
                    _uiState.value = ProfileState(
                        logoutSuccess = true,
                        isLoggingOut = false,
                        errorMessage = result.message
                    )
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }
    
    /**
     * Active le mode édition et remplit les champs avec les valeurs actuelles.
     */
    fun enableEditMode() {
        val user = _uiState.value.user ?: return
        _uiState.value = _uiState.value.copy(
            isEditMode = true,
            updateSuccess = false,
            errorMessage = null,
            editName = user.name,
            editEmail = user.email,
            editPhone = user.phone ?: "",
            editAddressLine1 = user.address?.line1 ?: "",
            editAddressLine2 = user.address?.line2 ?: "",
            editAddressCity = user.address?.city ?: "",
            editAddressRegion = user.address?.region ?: "",
            editAddressPostalCode = user.address?.postalCode ?: "",
            editAddressCountry = user.address?.country ?: ""
        )
    }
    
    /**
     * Annule le mode édition.
     */
    fun cancelEdit() {
        _uiState.value = _uiState.value.copy(
            isEditMode = false,
            updateSuccess = false,
            errorMessage = null,
            editPassword = "",
            editPasswordConfirm = ""
        )
    }
    
    /**
     * Met à jour un champ de texte éditable.
     */
    fun updateField(field: String, value: String) {
        _uiState.value = when (field) {
            "name" -> _uiState.value.copy(editName = value)
            "email" -> _uiState.value.copy(editEmail = value)
            "phone" -> _uiState.value.copy(editPhone = value)
            "addressLine1" -> _uiState.value.copy(editAddressLine1 = value)
            "addressLine2" -> _uiState.value.copy(editAddressLine2 = value)
            "addressCity" -> _uiState.value.copy(editAddressCity = value)
            "addressRegion" -> _uiState.value.copy(editAddressRegion = value)
            "addressPostalCode" -> _uiState.value.copy(editAddressPostalCode = value)
            "addressCountry" -> _uiState.value.copy(editAddressCountry = value)
            "password" -> _uiState.value.copy(editPassword = value)
            "passwordConfirm" -> _uiState.value.copy(editPasswordConfirm = value)
            else -> _uiState.value
        }
    }
    
    /**
     * Sauvegarde les modifications du profil.
     */
    fun saveProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, errorMessage = null)
            
            Log.d("ProfileViewModel", "=== Saving profile changes ===")
            
            val currentState = _uiState.value
            
            // Validation du mot de passe si modifié
            if (currentState.editPassword.isNotEmpty() || currentState.editPasswordConfirm.isNotEmpty()) {
                if (currentState.editPassword != currentState.editPasswordConfirm) {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        errorMessage = "Les mots de passe ne correspondent pas."
                    )
                    return@launch
                }
                if (currentState.editPassword.length < 6) {
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        errorMessage = "Le mot de passe doit contenir au moins 6 caractères."
                    )
                    return@launch
                }
            }
            
            // Normaliser l'email en minuscules
            val normalizedEmail = currentState.editEmail.trim().lowercase()
            
            // Créer la requête avec uniquement les champs modifiés
            val request = UpdateUserRequest(
                name = if (currentState.editName != currentState.user?.name) currentState.editName else null,
                email = if (normalizedEmail != currentState.user?.email) normalizedEmail else null,
                phone = if (currentState.editPhone != (currentState.user?.phone ?: "")) currentState.editPhone else null,
                password = if (currentState.editPassword.isNotEmpty()) currentState.editPassword else null,
                address = Address(
                    line1 = currentState.editAddressLine1.ifBlank { null },
                    line2 = currentState.editAddressLine2.ifBlank { null },
                    city = currentState.editAddressCity.ifBlank { null },
                    region = currentState.editAddressRegion.ifBlank { null },
                    postalCode = currentState.editAddressPostalCode.ifBlank { null },
                    country = currentState.editAddressCountry.ifBlank { null }
                )
            )
            
            when (val result = updateUserProfileUseCase(request)) {
                is Resource.Success -> {
                    Log.d("ProfileViewModel", "Profile updated successfully")
                    _uiState.value = _uiState.value.copy(
                        user = result.data,
                        isSaving = false,
                        isEditMode = false,
                        updateSuccess = true,
                        editPassword = "",
                        editPasswordConfirm = ""
                    )
                }
                is Resource.Error -> {
                    Log.e("ProfileViewModel", "Profile update error: ${result.message}")
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        errorMessage = result.message
                    )
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }
    
    /**
     * Affiche la boîte de dialogue de confirmation de suppression.
     */
    fun showDeleteConfirmation() {
        _uiState.value = _uiState.value.copy(showDeleteConfirmation = true)
    }
    
    /**
     * Cache la boîte de dialogue de confirmation de suppression.
     */
    fun hideDeleteConfirmation() {
        _uiState.value = _uiState.value.copy(showDeleteConfirmation = false)
    }
    
    /**
     * Supprime le compte de l'utilisateur après confirmation.
     */
    fun deleteAccount() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isDeleting = true,
                showDeleteConfirmation = false,
                errorMessage = null
            )
            
            Log.d("ProfileViewModel", "=== Deleting user account ===")
            
            when (val result = deleteCurrentUserUseCase()) {
                is Resource.Success -> {
                    Log.d("ProfileViewModel", "Account deleted successfully")
                    _uiState.value = ProfileState(
                        deleteSuccess = true,
                        isDeleting = false
                    )
                }
                is Resource.Error -> {
                    Log.e("ProfileViewModel", "Account deletion error: ${result.message}")
                    _uiState.value = _uiState.value.copy(
                        isDeleting = false,
                        errorMessage = result.message
                    )
                }
                is Resource.Loading -> {
                    // État déjà géré
                }
            }
        }
    }
}

