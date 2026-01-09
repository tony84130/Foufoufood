package com.example.foufoufood4.di

import com.example.foufoufood4.data.model.Review
import com.example.foufoufood4.data.model.ReviewDeserializer
import com.example.foufoufood4.data.model.DeliveryPartner
import com.example.foufoufood4.data.model.DeliveryPartnerDeserializer
import com.example.foufoufood4.data.remote.ApiService
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.example.foufoufood4.data.local.SessionManager // Import du SessionManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor // <-- Cet import est déjà là
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    private const val BASE_URL = "http://10.0.2.2:3000/foufoufood/"

    /**
     * Fournit un OkHttpClient avec un Interceptor pour ajouter le token JWT.
     * @param sessionManager Injecté pour récupérer le token d'authentification.
     */
    @Provides
    @Singleton
    fun provideOkHttpClient(sessionManager: SessionManager): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            // Utile pour le debug : affiche le corps de la requête/réponse dans les logs
            level = HttpLoggingInterceptor.Level.BODY // Correction de la référence
        }

        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            // 1. AJOUT DE L'INTERCEPTEUR D'AUTHENTIFICATION
            .addInterceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                val authToken = sessionManager.fetchAuthToken() // Récupération du token

                if (!authToken.isNullOrBlank()) {
                    // Ajout du header Authorization exigé par votre middleware 'authorize'
                    requestBuilder.addHeader("Authorization", "Bearer $authToken")
                }
                chain.proceed(requestBuilder.build())
            }
            .addInterceptor(loggingInterceptor) // Ajout de l'intercepteur de logging
            .build()
    }

    /**
     * Fournit Retrofit, en utilisant l'OkHttpClient configuré ci-dessus.
     * @param okHttpClient Injecté (contient l'intercepteur d'auth).
     */
    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .registerTypeAdapter(Review::class.java, ReviewDeserializer())
            .registerTypeAdapter(DeliveryPartner::class.java, DeliveryPartnerDeserializer())
            .create()
    }

    @Provides
    @Singleton
    fun provideRetrofit(gson: Gson, okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient) // <-- Utilisation du client OkHttp configuré
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
