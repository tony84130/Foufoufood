package com.example.foufoufood4.ui.screens.restaurant

import android.content.Intent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.R
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.ui.activity.profile.ProfileActivity
import com.example.foufoufood4.ui.activity.restaurant.RestaurantDetailActivity
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantListViewModel
import androidx.compose.material.icons.filled.ReceiptLong
import com.example.foufoufood4.ui.activity.order.OrderListActivity
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import com.example.foufoufood4.ui.activity.favorites.FavoritesActivity
import com.example.foufoufood4.ui.viewmodel.notification.NotificationViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestaurantListScreen(
    viewModel: RestaurantListViewModel = hiltViewModel(),
    // INJECTION DU NOUVEAU VIEWMDEL
    notificationViewModel: NotificationViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()

    // NOUVEAU : Collecter l'état de la notification
    val hasNotification by notificationViewModel.hasNewOrderNotification.collectAsState()

    // Récupère l'option de tri du ViewModel (pour SearchSection)
    val selectedSortOption by viewModel.sortOption.collectAsState()

    // Note: Le rechargement des favoris est maintenant géré dans RestaurantListActivity.onCreate()

    Scaffold(
        bottomBar = {
            AppBottomBar(
                // PASSER L'ÉTAT DE LA NOTIFICATION AU BOTTOM BAR
                hasNewOrderNotification = hasNotification,
                onProfileClick = {
                    val intent = Intent(context, ProfileActivity::class.java)
                    context.startActivity(intent)
                },
                // PASSER LA FONCTION DE RÉINITIALISATION DU BADGE
                onOrdersClick = {
                    notificationViewModel.ordersIconClicked()
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
        ) {
            // Section 1: Recherche et Tri (Fusionné)
            SearchSection(
                searchText = uiState.searchText,
                onSearchChange = viewModel::onSearchTextChanged,
                onRefreshClick = viewModel::fetchRestaurants,
                resultCount = uiState.restaurants.size,
                selectedSortOption = selectedSortOption, // Tri intégré
                onSortOptionSelected = viewModel::onSortOptionSelected // Tri intégré
            )

            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                uiState.errorMessage != null -> {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            "Erreur: ${uiState.errorMessage}",
                            color = Color.Red,
                            modifier = Modifier.padding(16.dp)
                        )
                        Button(onClick = viewModel::fetchRestaurants) {
                            Text("Réessayer")
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(top = 8.dp, bottom = 16.dp)
                    ) {
                        items(uiState.restaurants) { restaurant ->
                            val isFav = uiState.favoriteRestaurantIds.contains(restaurant.id)

                            RestaurantCard(
                                restaurant = restaurant,
                                isFavorite = isFav,
                                onFavoriteClick = { viewModel.toggleFavorite(restaurant.id) }, // Fonction de favoris
                                onClick = {
                                    val intent = Intent(context, RestaurantDetailActivity::class.java).apply {
                                        putExtra("RESTAURANT_ID", restaurant.id)
                                    }
                                    context.startActivity(intent)
                                }
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------------------------------------------
// COMPOSANTS DE L'ÉCRAN
// -------------------------------------------------------------------------------------------------

@Composable
fun SearchSection(
    searchText: String,
    onSearchChange: (String) -> Unit,
    onRefreshClick: () -> Unit,
    resultCount: Int,
    // PARAMÈTRES POUR LE TRI
    selectedSortOption: RestaurantSortOption,
    onSortOptionSelected: (RestaurantSortOption) -> Unit
) {
    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        OutlinedTextField(
            value = searchText,
            onValueChange = onSearchChange,
            placeholder = { Text("Sherbrooke", color = Color.DarkGray) },
            leadingIcon = {
                Icon(
                    Icons.Filled.Search,
                    contentDescription = "Recherche",
                    modifier = Modifier.size(24.dp)
                )
            },
            trailingIcon = {
                Icon(
                    painterResource(id = R.drawable.crayon),
                    contentDescription = "Modifier",
                    modifier = Modifier.size(24.dp)
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color.LightGray,
                unfocusedBorderColor = Color.LightGray,
                focusedContainerColor = Color(0xFFF0F0F0),
                unfocusedContainerColor = Color(0xFFF0F0F0)
            )
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // NOUVEAU: Le Sélecteur de Tri remplace le bouton "Filter"
            SortSelector(
                selectedOption = selectedSortOption,
                onOptionSelected = onSortOptionSelected
            )

            Spacer(modifier = Modifier.width(8.dp)) // Espace entre Tri et Refresh

            // L'icône Refresh est conservée pour l'actualisation manuelle
            Icon(
                Icons.Filled.Refresh,
                contentDescription = "Actualiser",
                modifier = Modifier
                    .size(24.dp)
                    .clickable { onRefreshClick() }
            )

            Spacer(modifier = Modifier.weight(1f))

            Text("$resultCount results", color = Color.DarkGray)
        }
    }
}

@Composable
fun SortSelector(
    selectedOption: RestaurantSortOption,
    onOptionSelected: (RestaurantSortOption) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .wrapContentWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            "Trier par:",
            fontWeight = FontWeight.SemiBold,
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.width(8.dp))

        Box {
            // Bouton qui affiche l'option sélectionnée et ouvre le menu
            OutlinedButton(
                onClick = { expanded = true },
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.onSurface,
                    containerColor = Color.Transparent
                ),
                border = ButtonDefaults.outlinedButtonBorder.copy(
                    brush = SolidColor(Color.LightGray)
                ),
                modifier = Modifier.height(36.dp) // Hauteur ajustée pour un look plus compact
            ) {
                Text(selectedOption.displayName, style = MaterialTheme.typography.bodySmall)
                Icon(
                    Icons.Filled.ReceiptLong,
                    contentDescription = "Options de tri",
                    modifier = Modifier
                        .size(18.dp)
                        .padding(start = 4.dp)
                )
            }

            // Menu déroulant
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                RestaurantSortOption.entries.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option.displayName) },
                        onClick = {
                            onOptionSelected(option)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}


@Composable
fun RestaurantCard(
    restaurant: Restaurant,
    isFavorite: Boolean,
    onFavoriteClick: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column {
            Image(
                painter = painterResource(id = R.drawable.image1),
                contentDescription = "Image de ${restaurant.name}",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(Color.Gray)
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 0.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        restaurant.name,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(
                        Modifier.padding(top = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${restaurant.getRatingDisplay()} (${restaurant.getReviewCount()} avis)",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "• ${restaurant.getCuisineDisplay()}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.DarkGray
                        )
                    }
                }

                // Espace pour aligner l'icône de favoris
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = onFavoriteClick,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Icon(
                            imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                            contentDescription = if (isFavorite) "Retirer des favoris" else "Ajouter aux favoris",
                            tint = if (isFavorite) Color.Red else Color.Gray
                        )
                    }
                }

            }

            Button(
                onClick = onClick,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .align(Alignment.End)
                    .width(100.dp)
            ) {
                Text("Select", color = Color.White)
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
fun AppBottomBar(
    hasNewOrderNotification: Boolean = false,
    onProfileClick: () -> Unit = {},
    onOrdersClick: () -> Unit = {} // <-- NOUVEAU CALLBACK
) {
    val context = LocalContext.current

    NavigationBar(containerColor = Color.White) {
        NavigationBarItem(
            icon = {
                Icon(
                    painterResource(id = R.drawable.home),
                    contentDescription = "Accueil",
                    modifier = Modifier.size(24.dp)
                )
            },
            selected = true,
            onClick = { /* Naviguer vers l'accueil */ }
        )
        // Item des COMMANDES (avec BadgedBox pour le badge '1')
        NavigationBarItem(
            icon = {
                BadgedBox(
                    badge = {
                        if (hasNewOrderNotification) { // <--- UTILISE L'ÉTAT PASSÉ
                            Badge(containerColor = Color.Red) {
                                // J'ai retiré le "1" pour utiliser un badge simple (point)
                            }
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Filled.ReceiptLong,
                        contentDescription = "Mes Commandes",
                        modifier = Modifier.size(24.dp)
                    )
                }
            },
            selected = false,
            onClick = {
                onOrdersClick() // <-- APPEL POUR RÉINITIALISER L'ÉTAT DANS LE VIEWMEL
                val intent = Intent(context, OrderListActivity::class.java)
                context.startActivity(intent)
            }
        )
        NavigationBarItem(
            icon = {
                Icon(
                    painterResource(id = R.drawable.coeur),
                    contentDescription = "Favoris",
                    modifier = Modifier.size(24.dp)
                )
            },
            selected = false,
            onClick = {
                val intent = Intent(context, FavoritesActivity::class.java)
                context.startActivity(intent)
            }
        )
        NavigationBarItem(
            icon = {
                Icon(
                    painterResource(id = R.drawable.profil),
                    contentDescription = "Profil",
                    modifier = Modifier.size(24.dp)
                )
            },
            selected = false,
            onClick = onProfileClick
        )
    }
}