package com.example.foufoufood4.ui.activity.auth

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.activity.admin.AdminDashboardActivity
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.ui.screens.auth.SignInScreen
import com.example.foufoufood4.ui.activity.restaurant.RestaurantListActivity
import com.example.foufoufood4.ui.activity.delivery.DeliveryDashboardActivity
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class SignInActivity : ComponentActivity() {

    @Inject
    lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                SignInScreen(
                    onSignInSuccess = {
                        // Navigation selon le rôle de l'utilisateur
                        val userRole = sessionManager.getUserRole()
                        val intent = when (userRole) {
                            "platform_admin", "restaurant_admin" -> {
                                // Les admins accèdent au dashboard d'administration
                                Intent(this@SignInActivity, AdminDashboardActivity::class.java)
                            }
                            "delivery_partner" -> {
                                // Les livreurs accèdent à leur dashboard de livraison
                                Intent(this@SignInActivity, DeliveryDashboardActivity::class.java)
                            }
                            else -> {
                                // Les clients accèdent à la liste des restaurants
                                Intent(this@SignInActivity, RestaurantListActivity::class.java)
                            }
                        }
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    }
                )
            }
        }
    }
}