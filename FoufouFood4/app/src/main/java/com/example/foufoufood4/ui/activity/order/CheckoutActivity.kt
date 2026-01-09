package com.example.foufoufood4.ui.activity.order

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.foufoufood4.ui.screens.order.CheckoutScreen
import com.example.foufoufood4.ui.activity.order.OrderSuccessActivity
import com.example.foufoufood4.data.local.SessionManager
import dagger.hilt.android.AndroidEntryPoint
import android.app.TaskStackBuilder
import com.example.foufoufood4.ui.activity.order.OrderDetailActivity
import com.example.foufoufood4.ui.activity.order.OrderListActivity
import com.example.foufoufood4.ui.activity.restaurant.RestaurantListActivity

@AndroidEntryPoint
class CheckoutActivity : ComponentActivity() {
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
                CheckoutScreen(
                    onBackClick = { finish() },
                    onOrderSuccess = { orderId ->
                        val mainIntent = Intent(this, RestaurantListActivity::class.java).apply {
                            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        }

                        val listIntent = Intent(this, OrderListActivity::class.java)

                        val detailIntent = Intent(this, OrderDetailActivity::class.java).apply {
                            putExtra("ORDER_ID", orderId)
                        }

                        TaskStackBuilder.create(this)
                            .addNextIntent(mainIntent)
                            .addNextIntent(listIntent)
                            .addNextIntent(detailIntent)
                            .startActivities()

                        finish()
                    }
                )
            }
        }
    }
}
