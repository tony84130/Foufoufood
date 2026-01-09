package com.example.foufoufood4.ui.activity.order

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.order.OrderListScreen
import com.example.foufoufood4.ui.activity.order.OrderDetailActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class OrderListActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                OrderListScreen(
                    onBackClick = { finish() },
                    onOrderClick = { orderId ->
                        val intent = Intent(this, OrderDetailActivity::class.java)
                        intent.putExtra("orderId", orderId)
                        startActivity(intent)
                    }
                )
            }
        }
    }
}
