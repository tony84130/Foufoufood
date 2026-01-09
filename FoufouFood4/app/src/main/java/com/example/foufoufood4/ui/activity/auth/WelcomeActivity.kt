package com.example.foufoufood4.ui.activity.auth

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.auth.WelcomeScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class WelcomeActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                WelcomeScreen(
                    onClientSignUpClick = {
                        // Navigation vers l'inscription client
                        val intent = Intent(this, ClientSignUpActivity::class.java)
                        startActivity(intent)
                    },
                    onDeliverySignUpClick = {
                        // Navigation vers l'inscription livreur
                        val intent = Intent(this, DeliveryPartnerSignUpActivity::class.java)
                        startActivity(intent)
                    },
                    onSignInClick = {
                        // Navigation vers la connexion
                        val intent = Intent(this, SignInActivity::class.java)
                        startActivity(intent)
                    }
                )
            }
        }
    }
}

