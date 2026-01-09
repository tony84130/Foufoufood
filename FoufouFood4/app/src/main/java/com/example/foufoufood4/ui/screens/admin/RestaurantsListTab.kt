package com.example.foufoufood4.ui.screens.admin

import android.content.Intent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.foundation.text.KeyboardOptions
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.R
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.ui.activity.restaurant.RestaurantDetailActivity
import com.example.foufoufood4.ui.viewmodel.admin.AdminState
import com.example.foufoufood4.ui.viewmodel.admin.AdminViewModel
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantManagementState
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantManagementViewModel

@Composable
fun RestaurantsListTab(
    viewModel: AdminViewModel,
    uiState: AdminState
) {
    val context = LocalContext.current
    val restaurantManagementViewModel: RestaurantManagementViewModel = hiltViewModel()
    val managementState by restaurantManagementViewModel.uiState.collectAsState()
    
    var showCreateDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var selectedRestaurant by remember { mutableStateOf<Restaurant?>(null) }

    // Observer les succès pour rafraîchir la liste
    LaunchedEffect(managementState.successMessage) {
        if (managementState.successMessage != null) {
            viewModel.loadData()
            showCreateDialog = false
            showEditDialog = false
            showDeleteDialog = false
            
            // Reset des messages après rafraîchissement
            kotlinx.coroutines.delay(500)
            restaurantManagementViewModel.clearMessages()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (uiState.restaurants.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Home,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Aucun restaurant trouvé", color = Color.Gray)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { showCreateDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Créer un restaurant")
                    }
                }
            }
        } else {
            Column(modifier = Modifier.fillMaxSize()) {
                // Statistique
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Home, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${uiState.restaurants.size} restaurant(s)",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Barre de recherche pour les restaurants
                RestaurantSearchBar(
                    searchQuery = uiState.restaurantSearchQuery,
                    onSearchQueryChanged = { query ->
                        viewModel.searchRestaurants(query)
                    }
                )

                // Liste des restaurants
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 80.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.restaurants) { restaurant ->
                        RestaurantAdminCard(
                            restaurant = restaurant,
                            currentUserRole = uiState.currentUserRole,
                            onClick = {
                                val intent = Intent(context, RestaurantDetailActivity::class.java).apply {
                                    putExtra("RESTAURANT_ID", restaurant.id)
                                    putExtra("RESTAURANT_NAME", restaurant.name)
                                }
                                context.startActivity(intent)
                            },
                            onEdit = {
                                selectedRestaurant = restaurant
                                showEditDialog = true
                            },
                            onDelete = {
                                selectedRestaurant = restaurant
                                showDeleteDialog = true
                            }
                        )
                    }
                }
            }
        }

        // Bouton flottant pour créer un restaurant
        if (!uiState.isLoading && uiState.currentUserRole == "restaurant_admin") {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Créer un restaurant")
            }
        }
    }

    // Dialogs
    if (showCreateDialog) {
        RestaurantCreateDialog(
            viewModel = restaurantManagementViewModel,
            managementState = managementState,
            onDismiss = { showCreateDialog = false }
        )
    }

    // Dialog d'édition : seulement pour restaurant_admin
    if (showEditDialog && selectedRestaurant != null && uiState.currentUserRole == "restaurant_admin") {
        RestaurantEditDialog(
            restaurant = selectedRestaurant!!,
            viewModel = restaurantManagementViewModel,
            managementState = managementState,
            onDismiss = { showEditDialog = false }
        )
    }

    if (showDeleteDialog && selectedRestaurant != null) {
        RestaurantDeleteDialog(
            restaurant = selectedRestaurant!!,
            viewModel = restaurantManagementViewModel,
            managementState = managementState,
            onDismiss = { showDeleteDialog = false }
        )
    }
}

@Composable
fun RestaurantAdminCard(
    restaurant: Restaurant,
    currentUserRole: String?,
    onClick: () -> Unit,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            // Image (cliquable pour voir détails)
            Image(
                painter = painterResource(id = R.drawable.image1),
                contentDescription = "Image de ${restaurant.name}",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
                    .background(Color.Gray)
                    .clickable(onClick = onClick)
            )

            // Infos
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = restaurant.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = restaurant.address,
                        fontSize = 14.sp,
                        color = Color.Gray
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = restaurant.getRatingDisplay(),
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    if (restaurant.cuisineType != null) {
                        Text(
                            text = restaurant.getCuisineDisplay(),
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
                
                // Boutons d'action
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Bouton Edit : seulement pour restaurant_admin
                    if (currentUserRole == "restaurant_admin") {
                        IconButton(onClick = onEdit) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Modifier",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    // Bouton Delete : pour platform_admin et restaurant_admin
                    IconButton(onClick = onDelete) {
                        Icon(
                            Icons.Default.Delete,
                            contentDescription = "Supprimer",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

// Dialog pour créer un restaurant
@Composable
fun RestaurantCreateDialog(
    viewModel: RestaurantManagementViewModel,
    managementState: RestaurantManagementState,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var cuisineType by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var openingHours by remember { mutableStateOf<List<com.example.foufoufood4.data.model.OpeningHours>>(emptyList()) }
    
    // Vérifier si tous les horaires sont valides
    val areOpeningHoursValid = openingHours.isEmpty() || openingHours.all { 
        isValidTime(it.open) && isValidTime(it.close) 
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Créer un restaurant",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))

                if (managementState.errorMessage != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = managementState.errorMessage ?: "",
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nom du restaurant") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Adresse") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = cuisineType,
                    onValueChange = { cuisineType = it },
                    label = { Text("Type de cuisine (optionnel)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Téléphone (optionnel)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                OpeningHoursEditor(
                    openingHours = openingHours,
                    onOpeningHoursChanged = { openingHours = it }
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Annuler")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (name.isNotBlank() && address.isNotBlank() && areOpeningHoursValid) {
                                viewModel.createRestaurant(
                                    name = name,
                                    address = address,
                                    cuisineType = cuisineType.ifBlank { null },
                                    phone = phone.ifBlank { null },
                                    openingHours = openingHours.ifEmpty { null }
                                )
                            }
                        },
                        enabled = name.isNotBlank() && address.isNotBlank() && areOpeningHoursValid && !managementState.isLoading
                    ) {
                        if (managementState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Créer")
                        }
                    }
                }
            }
        }
    }
}

// Dialog pour modifier un restaurant
@Composable
fun RestaurantEditDialog(
    restaurant: Restaurant,
    viewModel: RestaurantManagementViewModel,
    managementState: RestaurantManagementState,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf(restaurant.name) }
    var address by remember { mutableStateOf(restaurant.address) }
    var cuisineType by remember { mutableStateOf(restaurant.cuisineType ?: "") }
    var phone by remember { mutableStateOf(restaurant.phone ?: "") }
    var openingHours by remember { mutableStateOf(restaurant.openingHours ?: emptyList()) }
    
    // Vérifier si tous les horaires sont valides
    val areOpeningHoursValid = openingHours.isEmpty() || openingHours.all { 
        isValidTime(it.open) && isValidTime(it.close) 
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Modifier le restaurant",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))

                if (managementState.errorMessage != null) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = managementState.errorMessage ?: "",
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nom du restaurant") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Adresse") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = cuisineType,
                    onValueChange = { cuisineType = it },
                    label = { Text("Type de cuisine (optionnel)") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Téléphone (optionnel)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                OpeningHoursEditor(
                    openingHours = openingHours,
                    onOpeningHoursChanged = { openingHours = it }
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Annuler")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (name.isNotBlank() && address.isNotBlank() && areOpeningHoursValid) {
                                viewModel.updateRestaurant(
                                    restaurantId = restaurant.id,
                                    name = name,
                                    address = address,
                                    cuisineType = cuisineType.ifBlank { null },
                                    phone = phone.ifBlank { null },
                                    openingHours = openingHours.ifEmpty { null }
                                )
                            }
                        },
                        enabled = name.isNotBlank() && address.isNotBlank() && areOpeningHoursValid && !managementState.isLoading
                    ) {
                        if (managementState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Modifier")
                        }
                    }
                }
            }
        }
    }
}

// Dialog pour supprimer un restaurant
@Composable
fun RestaurantDeleteDialog(
    restaurant: Restaurant,
    viewModel: RestaurantManagementViewModel,
    managementState: RestaurantManagementState,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
        },
        title = {
            Text("Supprimer le restaurant ?")
        },
        text = {
            Column {
                Text("Êtes-vous sûr de vouloir supprimer \"${restaurant.name}\" ?")
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "⚠️ Tous les menus associés seront également supprimés.",
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 14.sp
                )
                
                if (managementState.errorMessage != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            text = managementState.errorMessage ?: "",
                            modifier = Modifier.padding(12.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { viewModel.deleteRestaurant(restaurant.id) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                ),
                enabled = !managementState.isLoading
            ) {
                if (managementState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onError
                    )
                } else {
                    Text("Supprimer")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Annuler")
            }
        }
    )
}

// Fonction de validation du format de l'heure (HH:mm)
private fun isValidTime(time: String): Boolean {
    if (time.isEmpty()) return true // Accepter les champs vides pendant la saisie
    
    // Vérifier le format avec regex: HH:mm
    val timeRegex = Regex("^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$")
    return timeRegex.matches(time)
}

// Composable pour gérer les horaires d'ouverture
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OpeningHoursEditor(
    openingHours: List<com.example.foufoufood4.data.model.OpeningHours>,
    onOpeningHoursChanged: (List<com.example.foufoufood4.data.model.OpeningHours>) -> Unit,
    modifier: Modifier = Modifier
) {
    val daysOfWeek = listOf(
        "Mon" to "Lundi",
        "Tue" to "Mardi",
        "Wed" to "Mercredi",
        "Thu" to "Jeudi",
        "Fri" to "Vendredi",
        "Sat" to "Samedi",
        "Sun" to "Dimanche"
    )
    
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Horaires d'ouverture",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
                IconButton(
                    onClick = {
                        // Ajouter un nouvel horaire (par défaut Lundi)
                        val newHours = openingHours.toMutableList()
                        newHours.add(
                            com.example.foufoufood4.data.model.OpeningHours(
                                day = "Mon",
                                open = "09:00",
                                close = "18:00"
                            )
                        )
                        onOpeningHoursChanged(newHours)
                    }
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Ajouter un horaire")
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            if (openingHours.isEmpty()) {
                Text(
                    text = "Aucun horaire défini",
                    color = Color.Gray,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(8.dp)
                )
            } else {
                openingHours.forEachIndexed { index, hours ->
                    OpeningHourItem(
                        hours = hours,
                        daysOfWeek = daysOfWeek,
                        onHoursChanged = { newHours ->
                            val updated = openingHours.toMutableList()
                            updated[index] = newHours
                            onOpeningHoursChanged(updated)
                        },
                        onDelete = {
                            val updated = openingHours.toMutableList()
                            updated.removeAt(index)
                            onOpeningHoursChanged(updated)
                        }
                    )
                    if (index < openingHours.size - 1) {
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OpeningHourItem(
    hours: com.example.foufoufood4.data.model.OpeningHours,
    daysOfWeek: List<Pair<String, String>>,
    onHoursChanged: (com.example.foufoufood4.data.model.OpeningHours) -> Unit,
    onDelete: () -> Unit
) {
    var dayExpanded by remember { mutableStateOf(false) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Dropdown pour le jour
                ExposedDropdownMenuBox(
                    expanded = dayExpanded,
                    onExpandedChange = { dayExpanded = !dayExpanded },
                    modifier = Modifier.weight(1f)
                ) {
                    OutlinedTextField(
                        value = daysOfWeek.find { it.first == hours.day }?.second ?: hours.day,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Jour", fontSize = 12.sp) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = dayExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
                        textStyle = MaterialTheme.typography.bodySmall
                    )
                    ExposedDropdownMenu(
                        expanded = dayExpanded,
                        onDismissRequest = { dayExpanded = false }
                    ) {
                        daysOfWeek.forEach { (code, name) ->
                            DropdownMenuItem(
                                text = { Text(name) },
                                onClick = {
                                    onHoursChanged(hours.copy(day = code))
                                    dayExpanded = false
                                }
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Supprimer",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Heure d'ouverture
                OutlinedTextField(
                    value = hours.open,
                    onValueChange = { newValue ->
                        // Filtrer pour n'accepter que les chiffres et ":"
                        val filtered = newValue.filter { it.isDigit() || it == ':' }
                        if (filtered.length <= 5) { // Format HH:mm (5 caractères max)
                            onHoursChanged(hours.copy(open = filtered))
                        }
                    },
                    label = { Text("Ouvre", fontSize = 11.sp) },
                    placeholder = { Text("09:00", fontSize = 11.sp) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodySmall,
                    isError = hours.open.isNotEmpty() && !isValidTime(hours.open),
                    supportingText = if (hours.open.isNotEmpty() && !isValidTime(hours.open)) {
                        { Text("Format: HH:mm", fontSize = 10.sp) }
                    } else null
                )
                
                // Heure de fermeture
                OutlinedTextField(
                    value = hours.close,
                    onValueChange = { newValue ->
                        // Filtrer pour n'accepter que les chiffres et ":"
                        val filtered = newValue.filter { it.isDigit() || it == ':' }
                        if (filtered.length <= 5) { // Format HH:mm (5 caractères max)
                            onHoursChanged(hours.copy(close = filtered))
                        }
                    },
                    label = { Text("Ferme", fontSize = 11.sp) },
                    placeholder = { Text("18:00", fontSize = 11.sp) },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodySmall,
                    isError = hours.close.isNotEmpty() && !isValidTime(hours.close),
                    supportingText = if (hours.close.isNotEmpty() && !isValidTime(hours.close)) {
                        { Text("Format: HH:mm", fontSize = 10.sp) }
                    } else null
                )
            }
        }
    }
}

/**
 * Barre de recherche pour les restaurants.
 */
@Composable
fun RestaurantSearchBar(
    searchQuery: String,
    onSearchQueryChanged: (String) -> Unit
) {
    OutlinedTextField(
        value = searchQuery,
        onValueChange = onSearchQueryChanged,
        label = { Text("Rechercher des restaurants...") },
        leadingIcon = {
            Icon(Icons.Default.Search, contentDescription = "Rechercher")
        },
        trailingIcon = {
            if (searchQuery.isNotEmpty()) {
                IconButton(onClick = { 
                    onSearchQueryChanged("")
                }) {
                    Icon(Icons.Default.Clear, contentDescription = "Effacer")
                }
            }
        },
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        singleLine = true
    )
}

