package com.example.foufoufood4.ui.activity.order

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.order.OrderDetailScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class OrderDetailActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val orderId = intent.getStringExtra("orderId") ?: ""

        setContent {
            MaterialTheme {
                OrderDetailScreen(
                    orderId = orderId,
                    onBackClick = { finish() }
                )
            }
        }
    }
}
