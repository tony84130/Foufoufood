package com.example.foufoufood4.data.repository

import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.data.model.CreateOrderRequest
import com.example.foufoufood4.data.model.response.OrderResponse
import com.example.foufoufood4.data.model.response.OrdersListResponse
import com.example.foufoufood4.data.remote.ApiService
import com.example.foufoufood4.data.common.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton
import com.example.foufoufood4.data.model.Cart
import com.example.foufoufood4.data.model.OrderItemRequest
import com.example.foufoufood4.data.model.response.SimpleApiResponse

@Singleton
class OrderRepository @Inject constructor(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {

    suspend fun createOrder(
        deliveryAddress: com.example.foufoufood4.data.model.DeliveryAddress,
        cart: Cart
    ): Flow<Resource<Order>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val orderItems = cart.items.map { cartItem ->
                OrderItemRequest(
                    menuItemId = cartItem.menuItem.id,
                    quantity = cartItem.quantity,
                    notes = cartItem.notes
                )
            }

            val request = CreateOrderRequest(
                deliveryAddress = deliveryAddress,
                useCart = false,
                restaurantId = cart.restaurantId,
                items = orderItems
            )

            val response = apiService.createOrder(request, "Bearer $token")

            if (response.isSuccessful && response.body()?.success == true) {
                val order = response.body()?.data
                if (order != null) {
                    emit(Resource.Success(order))
                } else {
                    emit(Resource.Error("La commande est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de la création de la commande"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun getMyOrders(): Flow<Resource<List<Order>>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val response = apiService.getMyOrders("Bearer $token")
            
            if (response.isSuccessful && response.body()?.success == true) {
                val orders = response.body()?.data
                if (orders != null) {
                    emit(Resource.Success(orders))
                } else {
                    emit(Resource.Error("La liste des commandes est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de la récupération des commandes"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun getOrderById(orderId: String): Flow<Resource<Order>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val response = apiService.getOrderById(orderId, "Bearer $token")
            
            if (response.isSuccessful && response.body()?.success == true) {
                val order = response.body()?.data
                if (order != null) {
                    emit(Resource.Success(order))
                } else {
                    emit(Resource.Error("La commande est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de la récupération de la commande"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun cancelOrder(orderId: String): Flow<Resource<Order>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val response = apiService.cancelOrder(orderId, "Bearer $token")
            
            if (response.isSuccessful && response.body()?.success == true) {
                val order = response.body()?.data
                if (order != null) {
                    emit(Resource.Success(order))
                } else {
                    emit(Resource.Error("La commande est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de l'annulation de la commande"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun getAvailableOrders(): Flow<Resource<List<Order>>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val response = apiService.getAvailableOrders("Bearer $token")
            
            if (response.isSuccessful && response.body()?.success == true) {
                val orders = response.body()?.data
                if (orders != null) {
                    emit(Resource.Success(orders))
                } else {
                    emit(Resource.Error("La liste des commandes est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de la récupération des commandes disponibles"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun assignOrderToMe(orderId: String): Flow<Resource<Order>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val response = apiService.assignOrderToMe(orderId, "Bearer $token")
            
            if (response.isSuccessful && response.body()?.success == true) {
                val order = response.body()?.data
                if (order != null) {
                    emit(Resource.Success(order))
                } else {
                    emit(Resource.Error("La commande est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de l'assignation de la commande"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun updateOrderStatus(orderId: String, status: String): Flow<Resource<Order>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val statusMap = mapOf("status" to status)
            val response = apiService.updateOrderStatus(orderId, statusMap, "Bearer $token")
            
            if (response.isSuccessful && response.body()?.success == true) {
                val order = response.body()?.data
                if (order != null) {
                    emit(Resource.Success(order))
                } else {
                    emit(Resource.Error("La commande est revenue nulle depuis l'API"))
                }
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur lors de la mise à jour du statut"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }

    suspend fun getMyAssignedOrders(): Flow<Resource<List<Order>>> = flow {
        emit(Resource.Loading)
        try {
            val token = sessionManager.fetchAuthToken()
            if (token == null) {
                emit(Resource.Error("Token d'authentification manquant"))
                return@flow
            }

            val response = apiService.getMyAssignedOrders("Bearer $token")

            if (response.isSuccessful && response.body()?.success == true) {
                val orders = response.body()?.data
                emit(Resource.Success(orders ?: emptyList()))
            } else {
                val errorMessage = response.body()?.message ?: response.message() ?: "Erreur récupération commandes assignées"
                emit(Resource.Error(errorMessage))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Erreur réseau: ${e.message}"))
        }
    }
    suspend fun checkPendingNotifications(): Resource<Boolean> {
        return try {
            val response = apiService.checkPendingNotifications()
            // On renvoie la valeur boolean pour le badge
            Resource.Success(response.hasNewOrderNotification)
        } catch (e: Exception) {
            Resource.Error("Erreur lors de la vérification des notifications manquées: ${e.message}")
        }
    }

    // NOUVEAU
    suspend fun clearPendingNotifications(): Resource<SimpleApiResponse> {
        return try {
            val response = apiService.clearPendingNotifications()
            Resource.Success(response)
        } catch (e: Exception) {
            Resource.Error("Erreur lors de l'effacement des notifications: ${e.message}")
        }
    }
}
