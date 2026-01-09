package com.example.foufoufood4.ui.screens.order

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.data.model.Order
import com.example.foufoufood4.ui.viewmodel.order.OrderDetailViewModel
import com.example.foufoufood4.ui.components.StatusChip
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailScreen(
    orderId: String,
    onBackClick: () -> Unit,
    viewModel: OrderDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val lifecycleOwner = LocalLifecycleOwner.current

    // Charger les détails de la commande au démarrage
    LaunchedEffect(lifecycleOwner) {
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                delay(60_000L)
                viewModel.refreshOrderDetails()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Détails de la commande") },
                navigationIcon = {
                    TextButton(onClick = onBackClick) {
                        Text("Retour")
                    }
                },
                actions = {
                    /*IconButton(
                        onClick = { viewModel.refreshOrderDetails() }
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Actualiser")
                    }*/
                }
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            
            uiState.order == null -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Commande introuvable",
                        fontSize = 18.sp,
                        color = Color.Gray
                    )
                }
            }
            
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        OrderHeaderCard(order = uiState.order!!)
                    }
                    
                    item {
                        OrderStatusCard(order = uiState.order!!)
                    }
                    
                    item {
                        OrderItemsCard(order = uiState.order!!)
                    }
                    
                    item {
                        OrderAddressCard(order = uiState.order!!)
                    }
                    
                    if (uiState.order!!.deliveryPartner != null) {
                        item {
                            DeliveryPartnerCard(order = uiState.order!!)
                        }
                    }
                    
                    item {
                        OrderSummaryCard(order = uiState.order!!)
                    }
                }
            }
        }

        // Message d'erreur
        uiState.errorMessage?.let { error ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Text(
                    text = error,
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    }
    /*Button(onClick = { viewModel.refreshOrderDetails() }) {
        Text("Rafraîchir")
    }*/
}

@Composable
fun OrderHeaderCard(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Commande #${order.id.takeLast(6)}",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                
                StatusChip(status = order.status)
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = "Passée le ${formatDate(order.createdAt)}",
                fontSize = 14.sp,
                color = Color.Gray
            )
        }
    }
}

@Composable
fun OrderStatusCard(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Timeline,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Statut de la commande",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            val statusSteps = listOf(
                "En attente" to (order.status == "En attente"),
                "Confirmée" to (order.status in listOf("Confirmée", "Préparée", "En livraison", "Livrée")),
                "Préparée" to (order.status in listOf("Préparée", "En livraison", "Livrée")),
                "En livraison" to (order.status in listOf("En livraison", "Livrée")),
                "Livrée" to (order.status == "Livrée")
            )
            
            statusSteps.forEachIndexed { index, (status, isCompleted) ->
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                        contentDescription = null,
                        tint = if (isCompleted) MaterialTheme.colorScheme.primary else Color.Gray,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = status,
                        fontSize = 14.sp,
                        color = if (isCompleted) MaterialTheme.colorScheme.primary else Color.Gray,
                        fontWeight = if (isCompleted) FontWeight.SemiBold else FontWeight.Normal
                    )
                }
                
                if (index < statusSteps.size - 1) {
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun OrderItemsCard(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Restaurant,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Articles commandés",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            order.items.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = item.name,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        if (item.notes.isNotEmpty()) {
                            Text(
                                text = "Note: ${item.notes}",
                                fontSize = 12.sp,
                                color = Color.Gray,
                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                            )
                        }
                    }
                    
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "${item.quantity}x ${String.format("%.2f", item.unitPrice)} $",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        Text(
                            text = "${String.format("%.2f", item.total)} $",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
                
                if (item != order.items.last()) {
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun OrderAddressCard(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Adresse de livraison",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = order.deliveryAddress.line1,
                fontSize = 14.sp
            )
            
            if (order.deliveryAddress.line2 != null) {
                Text(
                    text = order.deliveryAddress.line2!!,
                    fontSize = 14.sp
                )
            }
            
            Text(
                text = "${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}",
                fontSize = 14.sp
            )
            
            Text(
                text = "${order.deliveryAddress.region}, ${order.deliveryAddress.country}",
                fontSize = 14.sp
            )
        }
    }
}

@Composable
fun DeliveryPartnerCard(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.DeliveryDining,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Livreur assigné",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = order.deliveryPartner?.userName ?: "En attente d'assignation",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
fun OrderSummaryCard(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Récapitulatif",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Sous-total",
                    fontSize = 14.sp
                )
                Text(
                    text = "${String.format("%.2f", order.totalPrice)} $",
                    fontSize = 14.sp
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Frais de livraison",
                    fontSize = 14.sp
                )
                Text(
                    text = "Gratuit",
                    fontSize = 14.sp
                )
            }
            
            Divider(modifier = Modifier.padding(vertical = 8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Total",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${String.format("%.2f", order.totalPrice)} $",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}


private fun formatDate(dateString: String): String {
    // Simple date formatting - you might want to use a proper date formatter
    return dateString.substring(0, 10)
}
