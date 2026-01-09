package com.example.foufoufood4.ui.activity.auth

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.auth.DeliveryPartnerSignUpScreen
import com.example.foufoufood4.ui.activity.restaurant.RestaurantListActivity
import dagger.hilt.android.AndroidEntryPoint
import com.example.foufoufood4.ui.activity.delivery.DeliveryDashboardActivity

@AndroidEntryPoint
class DeliveryPartnerSignUpActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                DeliveryPartnerSignUpScreen(
                    onBackClick = { finish() },
                    onSignUpSuccess = {
                        // Navigation vers la liste des restaurants après inscription réussie
                        // Les livreurs peuvent aussi voir les restaurants pour livrer
                        val intent = Intent(this, DeliveryDashboardActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    },
                    onSignInClick = {
                        // Navigation vers la connexion
                        val intent = Intent(this, SignInActivity::class.java)
                        startActivity(intent)
                        finish()
                    }
                )
            }
        }
    }
}

