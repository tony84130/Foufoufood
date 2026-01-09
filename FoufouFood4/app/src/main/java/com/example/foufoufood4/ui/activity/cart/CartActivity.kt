package com.example.foufoufood4.ui.activity.cart

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.cart.CartScreen
import com.example.foufoufood4.ui.activity.order.CheckoutActivity
import com.example.foufoufood4.data.local.SessionManager
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class CartActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Vérifier que l'utilisateur n'est pas un platform_admin
        val sessionManager = SessionManager(this)
        val userRole = sessionManager.getUserRole()
        
        if (userRole == "platform_admin") {
            // Rediriger vers la liste des restaurants si c'est un platform_admin
            finish()
            return
        }

        setContent {
            MaterialTheme {
                CartScreen(
                    onBackClick = { finish() },
                    onCheckoutClick = {
                        // Navigation vers l'écran de checkout
                        val intent = Intent(this, CheckoutActivity::class.java)
                        startActivity(intent)
                    }
                )
            }
        }
    }
}
