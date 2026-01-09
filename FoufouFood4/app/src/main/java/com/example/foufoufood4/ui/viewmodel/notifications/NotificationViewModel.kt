package com.example.foufoufood4.ui.viewmodel.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import javax.inject.Inject
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.common.Resource // Assurez-vous d'avoir Resource
import com.example.foufoufood4.domain.usecase.CheckPendingNotificationsUseCase
import com.example.foufoufood4.domain.usecase.ClearPendingNotificationsUseCase

// Placeholders pour les dépendances (À adapter à votre implémentation réelle)
interface SessionManager {
    fun getUserId(): String?
    fun fetchAuthToken(): String?
}

// REMPLACEZ VOTRE_URL_SERVEUR par l'URL de votre serveur (ex: http://192.168.1.5:3000)
private const val SERVER_URL = "http://10.0.2.2:3000"

@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    // NOUVELLES INJECTIONS REQUISES
    private val checkPendingNotificationsUseCase: CheckPendingNotificationsUseCase,
    private val clearPendingNotificationsUseCase: ClearPendingNotificationsUseCase
) : ViewModel() {

    private val _hasNewOrderNotification = MutableStateFlow(false)
    val hasNewOrderNotification: StateFlow<Boolean> = _hasNewOrderNotification.asStateFlow()

    private lateinit var socket: Socket

    init {
        connectSocket()
    }

    private fun connectSocket() {
        // Configuration minimale de Socket.IO
        val options = IO.Options.builder().setForceNew(true).build()

        try {
            socket = IO.socket(SERVER_URL, options)
        } catch (e: Exception) {
            println("Erreur de connexion Socket.IO: ${e.message}")
            return
        }

        socket.on(Socket.EVENT_CONNECT) {
            println("Socket connecté!")
            // 1. Lance l'authentification et, si réussie, la vérification des notifications manquées
            loadAuthInfoAndAuthenticate()
        }.on(Socket.EVENT_DISCONNECT) {
            println("Socket déconnecté!")
        }.on("status_updated") { args ->
            handleOrderUpdate(args.getOrNull(0) as? JSONObject)
        }.on("order_confirmed") { args ->
            handleOrderUpdate(args.getOrNull(0) as? JSONObject)
        }

        socket.connect()
    }

    private fun loadAuthInfoAndAuthenticate() {
        val userId = sessionManager.getUserId()
        val authToken = sessionManager.fetchAuthToken()

        if (userId != null && !authToken.isNullOrBlank()) {
            val authData = JSONObject().apply {
                put("userId", userId)
                put("token", authToken)
            }
            // 1. Authentification Socket.IO (existante)
            socket.emit("authenticate", authData)
            println("Authentification Socket envoyée pour l'utilisateur $userId")

            // 2. VERIFICATION PERSISTANTE : Vérifiez les notifications stockées dans Redis
            viewModelScope.launch {
                checkForMissedUpdates()
            }
        } else {
            println("Avertissement: ID utilisateur ou token manquant. Le socket reste non authentifié.")
        }
    }

    /**
     * NOUVELLE FONCTION: Vérifie l'API REST pour les notifications manquées stockées dans Redis.
     */
    private suspend fun checkForMissedUpdates() {
        println("--- INFO : Vérification de l'état des commandes manquées via API...")
        when (val result = checkPendingNotificationsUseCase()) {
            is Resource.Success -> {
                if (result.data == true) {
                    _hasNewOrderNotification.value = true
                    println("--- NOTIFICATION TROUVÉE : Commande manquée en DB (badge ON).")
                } else {
                    println("--- INFO : Aucune notification manquée trouvée en DB.")
                }
            }
            is Resource.Error -> {
                println("--- ERREUR API : Impossible de vérifier les notifications manquées: ${result.message}")
            }
            // AJOUT DE LA BRANCHE MANQUANTE
            is Resource.Loading -> {
                println("--- INFO : Chargement de l'état des notifications manquées...")
            }
        }
    }

    private fun handleOrderUpdate(data: JSONObject?) {
        if (data != null) {
            // Mettre le badge à true pour signaler une nouvelle activité de commande (temps réel)
            _hasNewOrderNotification.value = true
        }
    }

    /**
     * Appelé lorsque l'utilisateur clique sur l'icône des commandes pour réinitialiser le badge.
     */
    fun ordersIconClicked() {
        // 1. Effacez le badge UI immédiatement
        _hasNewOrderNotification.value = false

        // 2. Effacez les notifications dans Redis via l'API (pour ne pas les revoir à la prochaine connexion)
        viewModelScope.launch {
            when(clearPendingNotificationsUseCase()) {
                is Resource.Success -> println("🗑️ Notifications effacées du serveur (API /clear).")
                is Resource.Error -> println("❌ Erreur lors de l'effacement côté serveur.")
                // AJOUT DE LA BRANCHE MANQUANTE
                is Resource.Loading -> {
                    println("--- INFO : Effacement en cours...")
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socket.disconnect()
    }
}