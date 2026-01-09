package com.example.foufoufood4.ui.screens.order

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.data.model.DeliveryAddress
import com.example.foufoufood4.ui.viewmodel.cart.CartViewModel
import com.example.foufoufood4.ui.viewmodel.order.CheckoutViewModel
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    onBackClick: () -> Unit,
    //onOrderSuccess: () -> Unit,
    onOrderSuccess: (orderId: String) -> Unit,
    cartViewModel: CartViewModel = hiltViewModel(),
    checkoutViewModel: CheckoutViewModel = hiltViewModel()
) {
    val cartState by cartViewModel.uiState.collectAsState()
    val checkoutState by checkoutViewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Variables pour l'adresse de livraison
    var line1 by remember { mutableStateOf("") }
    var line2 by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var region by remember { mutableStateOf("") }
    var postalCode by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("France") }

    // Flag pour savoir si on a déjà rempli les champs avec l'adresse de l'utilisateur
    var addressPrefilled by remember { mutableStateOf(false) }

    // Pré-remplir les champs avec l'adresse de l'utilisateur si disponible (une seule fois)
    LaunchedEffect(checkoutState.userAddress) {
        if (!addressPrefilled && checkoutState.userAddress != null) {
            val address = checkoutState.userAddress!!
            address.line1?.let { line1 = it }
            address.line2?.let { line2 = it }
            address.city?.let { city = it }
            address.region?.let { region = it }
            address.postalCode?.let { postalCode = it }
            address.country?.let { country = it }
            addressPrefilled = true
        }
    }

    // Variables pour les notes
    var notes by remember { mutableStateOf("") }

    // Observer le succès de la commande
    /*LaunchedEffect(checkoutState.isOrderCreated) {
        if (checkoutState.isOrderCreated) {
            //onOrderSuccess()
            onOrderSuccess(order.id)
        }
    }*/
    LaunchedEffect(key1 = checkoutState.isOrderCreated) {
        Log.d("CheckoutScreen", "LaunchedEffect triggered. isOrderCreated: ${checkoutState.isOrderCreated}")
        if (checkoutState.isOrderCreated) {
            val createdOrder = checkoutState.order
            Log.d("CheckoutScreen", "Order object: $createdOrder")
            if (createdOrder != null) {
                Log.d("CheckoutScreen", "Calling onOrderSuccess with ID: ${createdOrder.id}")
                Toast.makeText(context, "Commande passée !", Toast.LENGTH_LONG).show()
                onOrderSuccess(createdOrder.id)

                // Optionnel : réinitialiser le flag dans le ViewModel
                checkoutViewModel.resetOrderCreated()
            } else {
                Log.e("CheckoutScreen", "Error: isOrderCreated is true, but order object is null!")
                Toast.makeText(context, "Erreur: Commande créée mais non trouvée", Toast.LENGTH_SHORT).show()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Finaliser la commande") },
                navigationIcon = {
                    TextButton(onClick = onBackClick) {
                        Text("Retour")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (cartState.cart == null || cartState.cart!!.isEmpty) {
            EmptyCartContent()
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
            ) {
                // Récapitulatif de la commande
                OrderSummaryCard(
                    cart = cartState.cart!!,
                    modifier = Modifier.padding(16.dp)
                )

                // Formulaire d'adresse de livraison
                DeliveryAddressCard(
                    line1 = line1,
                    onLine1Change = { line1 = it },
                    line2 = line2,
                    onLine2Change = { line2 = it },
                    city = city,
                    onCityChange = { city = it },
                    region = region,
                    onRegionChange = { region = it },
                    postalCode = postalCode,
                    onPostalCodeChange = { postalCode = it },
                    country = country,
                    onCountryChange = { country = it },
                    modifier = Modifier.padding(16.dp)
                )

                // Notes de commande
                OrderNotesCard(
                    notes = notes,
                    onNotesChange = { notes = it },
                    modifier = Modifier.padding(16.dp)
                )

                // Bouton de commande
                Button(
                    onClick = {
                        if (line1.isNotBlank() && city.isNotBlank() && region.isNotBlank() && postalCode.isNotBlank()) {
                            val deliveryAddress = DeliveryAddress(
                                line1 = line1,
                                line2 = if (line2.isNotBlank()) line2 else null,
                                city = city,
                                region = region,
                                postalCode = postalCode,
                                country = country
                            )
                            checkoutViewModel.createOrder(deliveryAddress)
                        }
                    },
                    enabled = !checkoutState.isLoading && 
                             line1.isNotBlank() && 
                             city.isNotBlank() && 
                             region.isNotBlank() && 
                             postalCode.isNotBlank(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .height(56.dp)
                ) {
                    if (checkoutState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text(
                        text = "Confirmer la commande - ${String.format("%.2f", cartState.cart!!.totalPrice)} $",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Message d'erreur
                checkoutState.errorMessage?.let { error ->
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

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
fun EmptyCartContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "🛒",
            fontSize = 64.sp
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Votre panier est vide",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Ajoutez des plats à votre panier avant de passer commande",
            fontSize = 16.sp,
            color = Color.Gray
        )
    }
}

@Composable
fun OrderSummaryCard(
    cart: com.example.foufoufood4.data.model.Cart,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Récapitulatif de la commande",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = "Restaurant: ${cart.restaurantName}",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            cart.items.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${item.quantity}x ${item.menuItem.name}",
                        fontSize = 14.sp
                    )
                    Text(
                        text = "${String.format("%.2f", item.totalPrice)} $",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
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
                    text = "${String.format("%.2f", cart.totalPrice)} $",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
fun DeliveryAddressCard(
    line1: String,
    onLine1Change: (String) -> Unit,
    line2: String,
    onLine2Change: (String) -> Unit,
    city: String,
    onCityChange: (String) -> Unit,
    region: String,
    onRegionChange: (String) -> Unit,
    postalCode: String,
    onPostalCodeChange: (String) -> Unit,
    country: String,
    onCountryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
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
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = line1,
                onValueChange = onLine1Change,
                label = { Text("Adresse (obligatoire)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = line2,
                onValueChange = onLine2Change,
                label = { Text("Complément d'adresse (optionnel)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = city,
                    onValueChange = onCityChange,
                    label = { Text("Ville (obligatoire)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = postalCode,
                    onValueChange = onPostalCodeChange,
                    label = { Text("Code postal (obligatoire)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = region,
                    onValueChange = onRegionChange,
                    label = { Text("Région (obligatoire)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = country,
                    onValueChange = onCountryChange,
                    label = { Text("Pays") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }
        }
    }
}

@Composable
fun OrderNotesCard(
    notes: String,
    onNotesChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Note,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Notes de commande (optionnel)",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            OutlinedTextField(
                value = notes,
                onValueChange = onNotesChange,
                label = { Text("Instructions spéciales pour le restaurant...") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5
            )
        }
    }
}
