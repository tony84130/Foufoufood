package com.example.foufoufood4.ui.viewmodel.order

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderDetailViewModel @Inject constructor(
    private val orderRepository: OrderRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderDetailState())
    val uiState: StateFlow<OrderDetailState> = _uiState.asStateFlow()

    private val orderId: String = savedStateHandle.get<String>("orderId")
        ?: throw IllegalStateException("orderId non trouvé dans les arguments")

    init {
        refreshOrderDetails()
    }

    fun refreshOrderDetails() {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            orderRepository.getOrderById(orderId).collect { resource ->
                when (resource) {
                    is com.example.foufoufood4.data.common.Resource.Loading -> {
                        _uiState.value = _uiState.value.copy(isLoading = true)
                    }
                    is com.example.foufoufood4.data.common.Resource.Success -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            order = resource.data
                        )
                    }
                    is com.example.foufoufood4.data.common.Resource.Error -> {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = resource.message
                        )
                    }
                }
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }
}

data class OrderDetailState(
    val isLoading: Boolean = false,
    val order: Order? = null,
    val errorMessage: String? = null
)