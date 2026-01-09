package com.example.foufoufood4.ui.activity.restaurant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.restaurant.RestaurantDetailScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class RestaurantDetailActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val restaurantId = intent.getStringExtra("RESTAURANT_ID")
        val restaurantName = intent.getStringExtra("RESTAURANT_NAME")

        if (restaurantId == null) {
            finish()
            return
        }

        setContent {
            MaterialTheme {
                RestaurantDetailScreen(
                    restaurantId = restaurantId,
                    restaurantName = restaurantName ?: "Restaurant",
                    onBackClick = { finish() }
                )
            }
        }
    }
}

