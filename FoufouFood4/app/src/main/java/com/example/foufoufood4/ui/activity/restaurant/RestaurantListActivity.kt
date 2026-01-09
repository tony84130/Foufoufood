package com.example.foufoufood4.ui.activity.restaurant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.ui.screens.restaurant.RestaurantListScreen
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantListViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class RestaurantListActivity : ComponentActivity() {

    // Obtenir le ViewModel au niveau de l'Activity pour pouvoir y accéder dans onResume()
    private val viewModel: RestaurantListViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                // Note: Nous utilisons le ViewModel de l'Activity ici
                // Le ViewModel observe automatiquement les favoris depuis DataStore dans son init()
                RestaurantListScreen(viewModel = viewModel)
            }
        }
    }
}

