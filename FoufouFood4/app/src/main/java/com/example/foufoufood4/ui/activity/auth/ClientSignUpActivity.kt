package com.example.foufoufood4.ui.activity.auth

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.auth.ClientSignUpScreen
import com.example.foufoufood4.ui.activity.restaurant.RestaurantListActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ClientSignUpActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                ClientSignUpScreen(
                    onBackClick = { finish() },
                    onSignUpSuccess = {
                        // Navigation vers la liste des restaurants après inscription réussie
                        val intent = Intent(this, RestaurantListActivity::class.java)
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

