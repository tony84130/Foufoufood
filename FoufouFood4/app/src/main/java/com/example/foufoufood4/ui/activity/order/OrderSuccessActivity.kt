package com.example.foufoufood4.ui.activity.order

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.order.OrderSuccessScreen
import com.example.foufoufood4.ui.activity.restaurant.RestaurantListActivity
import com.example.foufoufood4.ui.activity.order.OrderListActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class OrderSuccessActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                OrderSuccessScreen(
                    onBackToRestaurants = {
                        // Navigation vers la liste des restaurants
                        val intent = Intent(this, RestaurantListActivity::class.java)
                        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        startActivity(intent)
                        finish()
                    },
                    onViewOrders = {
                        // Navigation vers la liste des commandes
                        val intent = Intent(this, OrderListActivity::class.java)
                        startActivity(intent)
                        finish()
                    }
                )
            }
        }
    }
}
