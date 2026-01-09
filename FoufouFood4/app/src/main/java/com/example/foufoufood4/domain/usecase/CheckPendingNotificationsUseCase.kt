package com.example.foufoufood4.domain.usecase

import com.example.foufoufood4.data.common.Resource
import com.example.foufoufood4.data.repository.OrderRepository
import javax.inject.Inject

class CheckPendingNotificationsUseCase @Inject constructor(
    private val orderRepository: OrderRepository
) {
    suspend operator fun invoke(): Resource<Boolean> {
        return orderRepository.checkPendingNotifications()
    }
}