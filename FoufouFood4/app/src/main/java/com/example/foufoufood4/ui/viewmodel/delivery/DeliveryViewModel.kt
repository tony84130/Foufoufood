package com.example.foufoufood4.ui.viewmodel.delivery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import com.example.foufoufood4.domain.usecase.auth.SignOutUseCase

data class DeliveryDashboardState(
    val isLoading: Boolean = false,
    val availableOrders: List<Order> = emptyList(),
    val myActiveOrders: List<Order> = emptyList(),
    val errorMessage: String? = null,
    val isLoggedOut: Boolean = false
)

@HiltViewModel
class DeliveryViewModel @Inject constructor(
    private val orderRepository: OrderRepository,
    private val signOutUseCase: SignOutUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(DeliveryDashboardState())
    val uiState: StateFlow<DeliveryDashboardState> = _uiState.asStateFlow()

    init {
        refreshAllOrders()
    }

    fun refreshAllOrders() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val availableJob = launch { loadAvailableOrders() }
            val assignedJob = launch { loadMyAssignedOrders() }

            availableJob.join()
            assignedJob.join()

            if (_uiState.value.errorMessage == null) {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    private suspend fun loadAvailableOrders() {
        orderRepository.getAvailableOrders().collect { resource ->
            when (resource) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        availableOrders = resource.data ?: emptyList()
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = resource.message
                    )
                }
                else -> {} // Loading géré par refreshAllOrders
            }
        }
    }

    // NOUVELLE FONCTION (privée)
    private suspend fun loadMyAssignedOrders() {
        orderRepository.getMyAssignedOrders().collect { resource ->
            when (resource) {
                is Resource.Success -> {
                    _uiState.value = _uiState.value.copy(
                        myActiveOrders = resource.data ?: emptyList()
                    )
                }
                is Resource.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = resource.message
                    )
                }
                else -> {}
            }
        }
    }

    fun refreshAvailableOrders() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            orderRepository.getAvailableOrders().collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            availableOrders = resource.data ?: emptyList()
                        )
                    }
                    is Resource.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                    is Resource.Loading -> {
                        _uiState.value = _uiState.value.copy(isLoading = true)
                    }
                }
            }
        }
    }

    fun assignOrderToMe(orderId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            orderRepository.assignOrderToMe(orderId).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        val assignedOrder = resource.data!!

                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            availableOrders = _uiState.value.availableOrders.filter { it.id != orderId },
                            myActiveOrders = _uiState.value.myActiveOrders + assignedOrder
                        )
                    }
                    is Resource.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                    is Resource.Loading -> {
                        _uiState.value = _uiState.value.copy(isLoading = true)
                    }
                }
            }
        }
    }

    fun updateOrderStatus(orderId: String, newStatus: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            orderRepository.updateOrderStatus(orderId, newStatus).collect { resource ->
                when (resource) {
                    is Resource.Success -> {
                        val updatedOrder = resource.data!!

                        val updatedList = _uiState.value.myActiveOrders.map {
                            if (it.id == orderId) updatedOrder else it
                        }

                        val activeList = if (newStatus == "Livrée") {
                            updatedList.filter { it.id != orderId }
                        } else {
                            updatedList
                        }

                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            myActiveOrders = activeList,
                            errorMessage = null
                        )
                    }
                    is Resource.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                    is Resource.Loading -> {
                        _uiState.value = _uiState.value.copy(isLoading = true)
                    }
                }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            signOutUseCase()
            _uiState.value = _uiState.value.copy(isLoggedOut = true)
        }
    }
}