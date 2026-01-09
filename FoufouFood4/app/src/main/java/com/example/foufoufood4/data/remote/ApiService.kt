package com.example.foufoufood4.data.remote

import com.example.foufoufood4.data.model.request.menu.AddMenuItemRequest
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.response.MenuResponse
import com.example.foufoufood4.data.model.response.AuthResponse
import com.example.foufoufood4.data.model.response.ApiListResponse
import com.example.foufoufood4.data.model.request.admin.CreateRestaurantAdminRequest
import com.example.foufoufood4.data.model.response.CreateRestaurantAdminResponse
import com.example.foufoufood4.data.model.request.restaurant.CreateRestaurantRequest
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.data.model.response.RestaurantResponse
import com.example.foufoufood4.data.model.request.auth.SignInRequest
import com.example.foufoufood4.data.model.request.auth.SignUpRequest
import com.example.foufoufood4.data.model.response.SimpleApiResponse
import com.example.foufoufood4.data.model.request.menu.UpdateMenuItemRequest
import com.example.foufoufood4.data.model.request.restaurant.UpdateRestaurantRequest
import com.example.foufoufood4.data.model.request.restaurant.AddReviewRequest
import com.example.foufoufood4.data.model.request.user.UpdateUserRequest
import com.example.foufoufood4.data.model.response.UserResponse
import com.example.foufoufood4.data.model.response.UsersListResponse
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.data.model.CreateOrderRequest
import com.example.foufoufood4.data.model.response.OrderResponse
import com.example.foufoufood4.data.model.response.OrdersListResponse
import com.example.foufoufood4.data.model.response.PendingNotificationResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // Définit une fonction pour l'appel GET sur la route "restaurants"
    // Le serveur renvoie: { "success": true, "data": [...] }
    @GET("restaurants")
    suspend fun getRestaurants(): Response<ApiListResponse<Restaurant>>

    // Recherche de restaurants
    @GET("restaurants/search")
    suspend fun searchRestaurants(@Query("q") query: String): Response<ApiListResponse<Restaurant>>

    // Récupère les restaurants de l'utilisateur actuel (restaurant_admin seulement)
    // Le serveur renvoie: { "success": true, "data": [...] }
    @GET("restaurants/me")
    suspend fun getMyRestaurants(@Header("Authorization") token: String): Response<ApiListResponse<Restaurant>>

    // Récupère un restaurant par son ID
    // Le serveur renvoie: { "success": true, "data": {...} }
    @GET("restaurants/{id}")
    suspend fun getRestaurantById(@Path("id") restaurantId: String): Response<RestaurantResponse>

    // Crée un nouveau restaurant (restaurant_admin)
    // Le serveur renvoie: { "success": true, "data": {...} }
    @POST("restaurants")
    suspend fun createRestaurant(
        @Body request: CreateRestaurantRequest,
        @Header("Authorization") token: String
    ): Response<RestaurantResponse>

    // Met à jour un restaurant (restaurant_admin)
    // Le serveur renvoie: { "success": true, "data": {...} }
    @PUT("restaurants/{id}")
    suspend fun updateRestaurant(
        @Path("id") restaurantId: String,
        @Body request: UpdateRestaurantRequest,
        @Header("Authorization") token: String
    ): Response<RestaurantResponse>

    // Supprime un restaurant (restaurant_admin)
    // Le serveur renvoie: { "success": true, "message": "..." }
    @DELETE("restaurants/{id}")
    suspend fun deleteRestaurant(
        @Path("id") restaurantId: String,
        @Header("Authorization") token: String
    ): Response<SimpleApiResponse>

    // Ajoute ou met à jour un avis pour un restaurant (client seulement)
    // Le serveur renvoie: { "success": true, "message": "...", "data": {...} }
    @POST("restaurants/{id}/reviews")
    suspend fun addRestaurantReview(
        @Path("id") restaurantId: String,
        @Body request: AddReviewRequest,
        @Header("Authorization") token: String
    ): Response<RestaurantResponse>

    // Supprime un avis d'un restaurant (client seulement)
    // Le serveur renvoie: { "success": true, "message": "...", "data": {...} }
    @DELETE("restaurants/{id}/reviews")
    suspend fun deleteRestaurantReview(
        @Path("id") restaurantId: String,
        @Header("Authorization") token: String
    ): Response<RestaurantResponse>

    @POST("auth/sign-up")
    suspend fun registerUser(@Body request: SignUpRequest): Response<AuthResponse>

    @POST("auth/sign-in")
    suspend fun signInUser(@Body request: SignInRequest): Response<AuthResponse>

    @POST("auth/sign-out")
    suspend fun signOut(@Header("Authorization") token: String): Response<AuthResponse>

    // Le serveur renvoie: { "success": true, "data": [...] }
    @GET("menus")
    suspend fun getRestaurantMenu(@Query("restaurantId") restaurantId: String): Response<ApiListResponse<Menu>>

    // Recherche de menus dans un restaurant
    @GET("menus/search")
    suspend fun searchMenuItems(
        @Query("restaurantId") restaurantId: String,
        @Query("q") query: String
    ): Response<ApiListResponse<Menu>>

    // Ajoute un menu à un restaurant (restaurant_admin)
    // Le serveur renvoie: { "success": true, "data": {...} }
    @POST("menus")
    suspend fun addMenuItem(
        @Body request: AddMenuItemRequest,
        @Header("Authorization") token: String
    ): Response<MenuResponse>

    // Met à jour un menu (restaurant_admin)
    // Le serveur renvoie: { "success": true, "data": {...} }
    @PUT("menus/{id}")
    suspend fun updateMenuItem(
        @Path("id") menuId: String,
        @Body request: UpdateMenuItemRequest,
        @Header("Authorization") token: String
    ): Response<MenuResponse>

    // Supprime un menu (restaurant_admin)
    // Le serveur renvoie: { "success": true, "message": "..." }
    @DELETE("menus/{id}")
    suspend fun deleteMenuItem(
        @Path("id") menuId: String,
        @Header("Authorization") token: String
    ): Response<SimpleApiResponse>
    
    // Récupère les informations d'un utilisateur par son ID
    // Le serveur renvoie: { "success": true, "data": {...} }
    @GET("users/{id}")
    suspend fun getUserById(
        @Path("id") userId: String,
        @Header("Authorization") token: String
    ): Response<UserResponse>
    
    // Met à jour le profil de l'utilisateur actuellement connecté
    // Le serveur renvoie: { "success": true, "data": {...} }
    @PUT("users/me")
    suspend fun updateCurrentUser(
        @Body request: UpdateUserRequest,
        @Header("Authorization") token: String
    ): Response<UserResponse>
    
    // Supprime le compte de l'utilisateur actuellement connecté
    // Le serveur renvoie: { "success": true, "message": "..." }
    @DELETE("users/me")
    suspend fun deleteCurrentUser(
        @Header("Authorization") token: String
    ): Response<SimpleApiResponse>
    
    // ========== ADMIN ENDPOINTS ==========
    
    // Récupère tous les utilisateurs (platform_admin seulement)
    // Le serveur renvoie: { "success": true, "data": [...] }
    @GET("users")
    suspend fun getAllUsers(
        @Header("Authorization") token: String
    ): Response<UsersListResponse>

    // Recherche d'utilisateurs (platform_admin seulement)
    @GET("users/search")
    suspend fun searchUsers(
        @Query("q") query: String,
        @Header("Authorization") token: String
    ): Response<UsersListResponse>
    
    // Supprime un utilisateur par son ID (platform_admin seulement)
    // Le serveur renvoie: { "success": true, "message": "..." }
    @DELETE("users/{id}")
    suspend fun deleteUserById(
        @Path("id") userId: String,
        @Header("Authorization") token: String
    ): Response<SimpleApiResponse>
    
    // Crée un restaurant avec son administrateur (platform_admin seulement)
    // Le serveur renvoie: { "success": true, "message": "...", "data": {...} }
    @POST("admin/restaurants")
    suspend fun createRestaurantWithAdmin(
        @Body request: CreateRestaurantAdminRequest,
        @Header("Authorization") token: String
    ): Response<CreateRestaurantAdminResponse>
    
    // ========== ORDER ENDPOINTS ==========
    
    // Crée une nouvelle commande (client seulement)
    @POST("orders")
    suspend fun createOrder(
        @Body request: CreateOrderRequest,
        @Header("Authorization") token: String
    ): Response<OrderResponse>
    
    // Récupère les commandes de l'utilisateur actuel (client seulement)
    @GET("orders")
    suspend fun getMyOrders(
        @Header("Authorization") token: String
    ): Response<OrdersListResponse>

    // Récupère les commandes assignées au livreur actuel
    @GET("orders/delivery/me")
    suspend fun getMyAssignedOrders(
        @Header("Authorization") token: String
    ): Response<OrdersListResponse>

    // Récupère une commande par son ID
    @GET("orders/{id}")
    suspend fun getOrderById(
        @Path("id") orderId: String,
        @Header("Authorization") token: String
    ): Response<OrderResponse>
    
    // Annule une commande (client seulement)
    @PUT("orders/{id}/cancel")
    suspend fun cancelOrder(
        @Path("id") orderId: String,
        @Header("Authorization") token: String
    ): Response<OrderResponse>
    
    // Récupère les commandes disponibles pour les livreurs
    @GET("orders/delivery/available")
    suspend fun getAvailableOrders(
        @Header("Authorization") token: String
    ): Response<OrdersListResponse>

    // Assigne une commande à un livreur
    @POST("orders/{id}/assign")
    suspend fun assignOrderToMe(
        @Path("id") orderId: String,
        @Header("Authorization") token: String
    ): Response<OrderResponse>
    
    // Met à jour le statut d'une commande (livreur seulement)
    @PUT("orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") orderId: String,
        @Body status: Map<String, String>,
        @Header("Authorization") token: String
    ): Response<OrderResponse>

    @GET("notifications/pending")
    suspend fun checkPendingNotifications(): PendingNotificationResponse


    @DELETE("notifications/clear")
    suspend fun clearPendingNotifications(): SimpleApiResponse
}