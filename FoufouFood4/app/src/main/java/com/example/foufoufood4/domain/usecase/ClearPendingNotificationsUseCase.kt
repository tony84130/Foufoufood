// .../domain/usecase/ClearPendingNotificationsUseCase.kt
package com.example.foufoufood4.domain.usecase

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.OrderRepository
import com.example.foufoufood4.data.model.response.SimpleApiResponse
import javax.inject.Inject

class ClearPendingNotificationsUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    suspend operator fun invoke(): Resource<SimpleApiResponse> {
        return orderRepository.clearPendingNotifications()
    }
}