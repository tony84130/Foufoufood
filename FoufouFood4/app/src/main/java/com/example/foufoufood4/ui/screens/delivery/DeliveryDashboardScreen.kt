package com.example.foufoufood4.ui.screens.delivery

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.ui.activity.profile.ProfileActivity
import com.example.foufoufood4.ui.viewmodel.delivery.DeliveryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryDashboardScreen(
    //onBackClick: () -> Unit,
    viewModel: DeliveryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tableau de bord Livreur") },
                actions = {
                    // Bouton Profile
                    IconButton(onClick = {
                        context.startActivity(Intent(context, ProfileActivity::class.java))
                    }) {
                        Icon(Icons.Default.Person, contentDescription = "Profil")
                    }
                    
                    // Bouton Refresh
                    IconButton(onClick = { viewModel.refreshAllOrders() }) {
                        Icon(Icons.Default.Refresh, "Rafraîchir")
                    }
                }
            )
        }
    ) { paddingValues ->

        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {

            uiState.errorMessage?.let { error ->
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                        Text(
                            text = error,
                            modifier = Modifier.padding(16.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }

            item {
                Text(
                    text = "Mes courses en cours (${uiState.myActiveOrders.size})",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            if (uiState.myActiveOrders.isEmpty()) {
                item {
                    InfoCard("Vous n'avez aucune course en cours.")
                }
            } else {
                items(uiState.myActiveOrders) { order ->
                    MyOrderCard(
                        order = order,
                        onUpdateStatus = { newStatus ->
                            viewModel.updateOrderStatus(order.id, newStatus)
                        }
                    )
                }
            }

            item {
                Text(
                    text = "Commandes disponibles (${uiState.availableOrders.size})",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            if (uiState.availableOrders.isEmpty()) {
                item {
                    InfoCard("Aucune commande disponible pour le moment.")
                }
            } else {
                items(uiState.availableOrders) { order ->
                    AvailableOrderCard(
                        order = order,
                        onAssign = { viewModel.assignOrderToMe(order.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun MyOrderCard(
    order: Order,
    onUpdateStatus: (newStatus: String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(order.restaurant.name, style = MaterialTheme.typography.titleLarge)
            Text("Client: ${order.user.name}", style = MaterialTheme.typography.bodyMedium)
            //Text("Adresse: ${order.deliveryAddress.street}, ${order.deliveryAddress.city}", style = MaterialTheme.typography.bodyMedium)
            Text("Adresse: ${order.deliveryAddress.line1}, ${order.deliveryAddress.city}", style = MaterialTheme.typography.bodyMedium)
            Text("Statut: ${order.status}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)

            Spacer(Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Le bouton s'adapte au statut actuel
                when (order.status) {
                    "Préparée" -> {
                        Button(
                            onClick = { onUpdateStatus("En livraison") },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Commande Récupérée")
                        }
                    }
                    "En livraison" -> {
                        Button(
                            onClick = { onUpdateStatus("Livrée") },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text("Commande Livrée")
                        }
                    }
                    else -> {
                        // "Livrée" ou "Annulée", on n'affiche rien
                    }
                }
            }
        }
    }
}

@Composable
fun AvailableOrderCard(
    order: Order,
    onAssign: () -> Unit
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(order.restaurant.name, style = MaterialTheme.typography.titleLarge)
            Text("Adresse: ${order.restaurant.address}", style = MaterialTheme.typography.bodyMedium)
            Text("Montant: ${String.format("%.2f", order.totalPrice)} $", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)

            Spacer(Modifier.height(16.dp))

            Button(
                onClick = onAssign,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Accepter la course")
            }
        }
    }
}

@Composable
fun InfoCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
        )
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Info, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
            Spacer(Modifier.width(8.dp))
            Text(message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}