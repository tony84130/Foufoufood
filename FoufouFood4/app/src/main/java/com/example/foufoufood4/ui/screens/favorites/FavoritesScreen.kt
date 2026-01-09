package com.example.foufoufood4.ui.screens.favorites

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.ui.activity.restaurant.RestaurantDetailActivity
// Import RestaurantCard from the correct package
import com.example.foufoufood4.ui.screens.restaurant.RestaurantCard
// Import the view model
import com.example.foufoufood4.ui.viewmodel.favorites.FavoritesViewModel
// Import the restaurant view model to use toggleFavorite if needed directly
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FavoritesScreen(
    onBackClick: () -> Unit,
    viewModel: FavoritesViewModel = hiltViewModel(),
    // We also need RestaurantListViewModel to toggle favorites from this screen
    restaurantListViewModel: RestaurantListViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    // Get favorite IDs from RestaurantListViewModel to pass to RestaurantCard
    val listUiState by restaurantListViewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Récupérer l'ID utilisateur pour recharger les favoris quand il change
    val sessionManager = remember { SessionManager(context) }
    // Utiliser derivedStateOf pour réagir aux changements d'utilisateur
    var currentUserId by remember { mutableStateOf(sessionManager.getUserId()) }

    // Recharger les favoris lorsque l'écran devient visible
    LaunchedEffect(Unit) {
        // Recharger immédiatement au démarrage
        viewModel.reloadFavorites()
        restaurantListViewModel.reloadFavorites()
    }
    
    // Surveiller les changements d'utilisateur
    LaunchedEffect(currentUserId) {
        currentUserId = sessionManager.getUserId()
        viewModel.reloadFavorites()
        restaurantListViewModel.reloadFavorites()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mes Favoris") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour")
                    }
                }
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.errorMessage != null -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Erreur: ${uiState.errorMessage}")
                }
            }
            uiState.favoriteRestaurants.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        "❤️\nAucun restaurant favori pour le moment.",
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        fontSize = 18.sp
                    )
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(uiState.favoriteRestaurants) { restaurant ->
                        // Check if it's still favorite according to the list view model's state
                        val isFav = listUiState.favoriteRestaurantIds.contains(restaurant.id)

                        RestaurantCard(
                            restaurant = restaurant,
                            isFavorite = isFav,
                            onFavoriteClick = {
                                // Call toggle on the RestaurantListViewModel
                                restaurantListViewModel.toggleFavorite(restaurant.id)
                                // Optional: Refresh this screen's list after toggle if needed
                                // viewModel.loadFavoriteRestaurants()
                            },
                            onClick = {
                                val intent = Intent(context, RestaurantDetailActivity::class.java).apply {
                                    putExtra("RESTAURANT_ID", restaurant.id)
                                    putExtra("RESTAURANT_NAME", restaurant.name)
                                }
                                context.startActivity(intent)
                            }
                        )
                    }
                }
            }
        }
    }
}