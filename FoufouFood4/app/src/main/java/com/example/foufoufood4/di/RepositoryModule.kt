package com.example.foufoufood4.di

import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.remote.ApiService
import com.example.foufoufood4.data.repository.AdminRepository
import com.example.foufoufood4.data.repository.AuthRepository
import com.example.foufoufood4.data.repository.CartRepository
import com.example.foufoufood4.data.repository.MenuRepository
import com.example.foufoufood4.data.repository.OrderRepository
import com.example.foufoufood4.data.repository.RestaurantRepository
import com.example.foufoufood4.data.repository.UserRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideRestaurantRepository(
        apiService: ApiService,
        sessionManager: SessionManager
    ): RestaurantRepository {
        return RestaurantRepository(apiService, sessionManager)
    }

    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: ApiService,
        sessionManager: SessionManager
    ): AuthRepository {
        return AuthRepository(apiService, sessionManager)
    }
    
    @Provides
    @Singleton
    fun provideUserRepository(
        apiService: ApiService,
        sessionManager: SessionManager
    ): UserRepository {
        return UserRepository(apiService, sessionManager)
    }
    
    @Provides
    @Singleton
    fun provideAdminRepository(
        apiService: ApiService,
        sessionManager: SessionManager
    ): AdminRepository {
        return AdminRepository(apiService, sessionManager)
    }

    @Provides
    @Singleton
    fun provideMenuRepository(
        apiService: ApiService,
        sessionManager: SessionManager
    ): MenuRepository {
        return MenuRepository(apiService, sessionManager)
    }

    @Provides
    @Singleton
    fun provideCartRepository(
        sessionManager: SessionManager
    ): CartRepository {
        return CartRepository(sessionManager)
    }

    @Provides
    @Singleton
    fun provideOrderRepository(
        apiService: ApiService,
        sessionManager: SessionManager
    ): OrderRepository {
        return OrderRepository(apiService, sessionManager)
    }
}

