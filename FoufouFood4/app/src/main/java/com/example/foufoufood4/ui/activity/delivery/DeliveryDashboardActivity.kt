package com.example.foufoufood4.ui.activity.delivery

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.lifecycleScope
import com.example.foufoufood4.ui.activity.auth.SignInActivity
import com.example.foufoufood4.ui.screens.delivery.DeliveryDashboardScreen
import com.example.foufoufood4.ui.viewmodel.delivery.DeliveryViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import com.example.foufoufood4.ui.activity.auth.WelcomeActivity

@AndroidEntryPoint
class DeliveryDashboardActivity : ComponentActivity() {

    private val viewModel: DeliveryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        observeLogout()

        setContent {
            MaterialTheme {
                DeliveryDashboardScreen(viewModel = viewModel)
            }
        }
    }

    private fun observeLogout() {
        lifecycleScope.launch {
            viewModel.uiState.collectLatest { state ->
                if (state.isLoggedOut) {
                    val intent = Intent(this@DeliveryDashboardActivity, WelcomeActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
        }
    }
}