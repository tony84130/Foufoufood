package com.example.foufoufood4.ui.screens.restaurant
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantManagementState

import android.content.Intent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.R
import com.example.foufoufood4.data.local.SessionManager
import com.example.foufoufood4.data.model.Menu
import com.example.foufoufood4.data.model.Restaurant
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantDetailViewModel
import com.example.foufoufood4.ui.viewmodel.restaurant.RestaurantManagementViewModel
import com.example.foufoufood4.ui.viewmodel.cart.CartViewModel
import com.example.foufoufood4.ui.activity.cart.CartActivity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RestaurantDetailScreen(
    restaurantId: String,
    restaurantName: String,
    onBackClick: () -> Unit,
    viewModel: RestaurantDetailViewModel = hiltViewModel(),
    managementViewModel: RestaurantManagementViewModel = hiltViewModel(),
    cartViewModel: CartViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val managementState by managementViewModel.uiState.collectAsState()
    val cartState by cartViewModel.uiState.collectAsState()
    
    var showAddMenuDialog by remember { mutableStateOf(false) }
    var showEditMenuDialog by remember { mutableStateOf(false) }
    var showDeleteMenuDialog by remember { mutableStateOf(false) }
    var showReviewDialog by remember { mutableStateOf(false) }
    var selectedMenu by remember { mutableStateOf<Menu?>(null) }
    
    // Vérifier si l'utilisateur est un admin restaurant (gérer les permissions)
    val sessionManager = remember { SessionManager(context) }
    val userRole = remember { sessionManager.getUserRole() }
    val isAdminView = remember { userRole == "restaurant_admin" }
    val isClientView = remember { userRole == "client" }
    val isPlatformAdmin = remember { userRole == "platform_admin" }
    val canOrder = remember { isClientView && !isPlatformAdmin } // Seuls les clients peuvent commander
    val currentUserId = remember { sessionManager.getUserId() }
    
    // Trouver l'avis de l'utilisateur actuel s'il existe
    val userReview = remember(uiState.restaurant, currentUserId) {
        uiState.restaurant?.reviews?.find { review ->
            review.user == currentUserId
        }
    }

    // Charger les données du restaurant au démarrage
    LaunchedEffect(restaurantId) {
        viewModel.loadRestaurantDetails(restaurantId)
    }
    
    // Observer les modifications pour rafraîchir la liste
    LaunchedEffect(managementState.successMessage) {
        if (managementState.successMessage != null) {
            viewModel.loadRestaurantDetails(restaurantId)
            showAddMenuDialog = false
            showEditMenuDialog = false
            showDeleteMenuDialog = false
            selectedMenu = null
            
            // Reset des messages
            kotlinx.coroutines.delay(500)
            managementViewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.restaurant?.name ?: restaurantName) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour")
                    }
                },
                actions = {
                    // Bouton panier pour les clients uniquement (pas pour les admins)
                    if (canOrder) {
                        Box {
                            IconButton(
                                onClick = {
                                    val intent = Intent(context, CartActivity::class.java)
                                    context.startActivity(intent)
                                }
                            ) {
                                Icon(Icons.Default.ShoppingCart, contentDescription = "Panier")
                            }
                            // Badge avec le nombre d'articles
                            if (cartState.cart != null && cartState.cart!!.totalItems > 0) {
                                Badge(
                                    modifier = Modifier.offset(x = (-8).dp, y = 8.dp)
                                ) {
                                    Text(cartState.cart!!.totalItems.toString())
                                }
                            }
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            // Bouton pour ajouter un menu (visible pour les admins)
            if (isAdminView) {
                FloatingActionButton(
                    onClick = { showAddMenuDialog = true }
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Ajouter un menu")
                }
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                uiState.errorMessage != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            "Erreur: ${uiState.errorMessage}",
                            color = MaterialTheme.colorScheme.error,
                            modifier = Modifier.padding(16.dp),
                            textAlign = TextAlign.Center
                        )
                        Button(onClick = { viewModel.loadRestaurantDetails(restaurantId) }) {
                            Text("Réessayer")
                        }
                    }
                }
                uiState.restaurant != null -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentPadding = PaddingValues(bottom = if (isAdminView) 80.dp else 16.dp)
                    ) {
                        // En-tête avec image du restaurant
                        item {
                            RestaurantHeader(restaurant = uiState.restaurant!!)
                        }

                        // Informations du restaurant
                        item {
                            RestaurantInfoSection(restaurant = uiState.restaurant!!)
                        }

                        // Section des avis (visible pour les clients et les restaurant_admin)
                        if (isClientView || isAdminView) {
                            item {
                                ReviewsSection(
                                    restaurant = uiState.restaurant!!,
                                    userReview = userReview,
                                    canModifyReviews = isClientView, // Seuls les clients peuvent modifier
                                    onAddReviewClick = { showReviewDialog = true },
                                    onEditReviewClick = { showReviewDialog = true },
                                    onDeleteReviewClick = {
                                        viewModel.deleteReview(restaurantId)
                                    }
                                )
                            }
                        }

                        // Titre de la section menu
                        item {
                            Text(
                                text = "Menu",
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        // Barre de recherche pour les menus
                        item {
                            MenuSearchBar(
                                searchQuery = uiState.searchQuery,
                                onSearchQueryChanged = { query ->
                                    viewModel.searchMenuItems(restaurantId, query)
                                }
                            )
                        }

                        // Liste des items du menu
                        if (uiState.menuItems.isEmpty()) {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(32.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "Aucun menu disponible pour le moment.",
                                        modifier = Modifier.padding(horizontal = 16.dp),
                                        color = Color.Gray,
                                        textAlign = TextAlign.Center
                                    )
                                    if (isAdminView) {
                                        Spacer(modifier = Modifier.height(16.dp))
                                        Button(onClick = { showAddMenuDialog = true }) {
                                            Icon(Icons.Default.Add, contentDescription = null)
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("Ajouter un premier menu")
                                        }
                                    }
                                }
                            }
                        } else {
                            items(uiState.menuItems) { menuItem ->
                                MenuItemCard(
                                    menuItem = menuItem,
                                    modifier = Modifier.padding(horizontal = 16.dp),
                                    isAdminView = isAdminView,
                                    onEdit = {
                                        selectedMenu = menuItem
                                        showEditMenuDialog = true
                                    },
                                    onDelete = {
                                        selectedMenu = menuItem
                                        showDeleteMenuDialog = true
                                    },
                                    onAddToCart = if (canOrder && uiState.restaurant != null) {
                                        {
                                            cartViewModel.addItemToCart(
                                                menuItem = menuItem,
                                                restaurant = uiState.restaurant!!,
                                                quantity = 1
                                            )
                                        }
                                    } else null,
                                    canAddToCart = if (canOrder && uiState.restaurant != null) {
                                        cartViewModel.canAddToCart(uiState.restaurant!!)
                                    } else false
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                        }
                    }
                }
            }
        }
        
        // Dialogs
        if (showAddMenuDialog) {
            AddMenuDialog(
                restaurantId = restaurantId,
                viewModel = managementViewModel,
                managementState = managementState,
                onDismiss = { showAddMenuDialog = false }
            )
        }
        
        if (showEditMenuDialog && selectedMenu != null) {
            EditMenuDialog(
                menu = selectedMenu!!,
                viewModel = managementViewModel,
                managementState = managementState,
                onDismiss = { showEditMenuDialog = false }
            )
        }
        
        if (showDeleteMenuDialog && selectedMenu != null) {
            DeleteMenuDialog(
                menu = selectedMenu!!,
                viewModel = managementViewModel,
                managementState = managementState,
                onDismiss = { showDeleteMenuDialog = false }
            )
        }
        
        // Dialog pour ajouter/modifier un avis
        if (showReviewDialog && isClientView) {
            ReviewDialog(
                restaurantId = restaurantId,
                existingReview = userReview,
                viewModel = viewModel,
                onDismiss = { showReviewDialog = false }
            )
        }
    }
}

/**
 * En-tête du restaurant avec image et informations de base.
 */
@Composable
fun RestaurantHeader(restaurant: Restaurant) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(250.dp)
    ) {
        // Image du restaurant
        Image(
            painter = painterResource(id = R.drawable.image1),
            contentDescription = "Image de ${restaurant.name}",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Gray)
        )

        // Overlay avec gradient
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    androidx.compose.ui.graphics.Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Black.copy(alpha = 0.7f)
                        ),
                        startY = 100f
                    )
                )
        )

        // Nom du restaurant en bas de l'image
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
        ) {
            Text(
                text = restaurant.name,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 4.dp)
            ) {
                Text(
                    text = restaurant.getRatingDisplay(),
                    fontSize = 16.sp,
                    color = Color.White
                )
                Text(
                    text = " • ${restaurant.getReviewCount()} avis",
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.8f)
                )
                if (restaurant.cuisineType != null) {
                    Text(
                        text = " • ${restaurant.getCuisineDisplay()}",
                        fontSize = 16.sp,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}

/**
 * Section d'informations détaillées du restaurant.
 */
@Composable
fun RestaurantInfoSection(restaurant: Restaurant) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Informations",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Adresse
            InfoRow(
                icon = Icons.Default.LocationOn,
                label = "Adresse",
                value = restaurant.address
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Téléphone
            InfoRow(
                icon = Icons.Default.Phone,
                label = "Téléphone",
                value = restaurant.getPhoneDisplay()
            )

            // Horaires d'ouverture
            if (!restaurant.openingHours.isNullOrEmpty()) {
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(end = 12.dp)
                    )
                    Column {
                        Text(
                            text = "Horaires",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        restaurant.openingHours.forEach { hours ->
                            Text(
                                text = hours.getFormattedHours(),
                                fontSize = 14.sp,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Ligne d'information avec icône.
 */
@Composable
fun InfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(end = 12.dp)
        )
        Column {
            Text(
                text = label,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = value,
                fontSize = 14.sp,
                color = Color.Gray
            )
        }
    }
}

/**
 * Card pour afficher un item de menu.
 */
@Composable
fun MenuItemCard(
    menuItem: Menu,
    modifier: Modifier = Modifier,
    isAdminView: Boolean = false,
    onEdit: () -> Unit = {},
    onDelete: () -> Unit = {},
    onAddToCart: (() -> Unit)? = null,
    canAddToCart: Boolean = true
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = menuItem.name,
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                if (menuItem.description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = menuItem.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
                if (menuItem.category.isNotBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Catégorie: ${menuItem.category}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 12.sp
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "$${String.format("%.2f", menuItem.price)}",
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.primary
                )
                
                // Boutons d'action
                Spacer(modifier = Modifier.height(8.dp))
                Row {
                    if (isAdminView) {
                        // Boutons pour les admins
                        IconButton(
                            onClick = onEdit,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.Edit,
                                contentDescription = "Modifier",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(4.dp))
                        IconButton(
                            onClick = onDelete,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Supprimer",
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    } else {
                        // Bouton d'ajout au panier pour les clients
                        if (onAddToCart != null) {
                            Button(
                                onClick = onAddToCart,
                                enabled = canAddToCart,
                                modifier = Modifier.height(36.dp)
                            ) {
                                Icon(
                                    Icons.Default.Add,
                                    contentDescription = "Ajouter au panier",
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Ajouter", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// Dialog pour ajouter un menu
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddMenuDialog(
    restaurantId: String,
    viewModel: RestaurantManagementViewModel,
    managementState: RestaurantManagementState,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priceText by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Autre") }
    var expanded by remember { mutableStateOf(false) }
    
    val categories = listOf("Entrée", "Plat", "Dessert", "Boisson", "Accompagnement", "Autre")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Ajouter un menu",
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
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 14.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nom du plat") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = priceText,
                    onValueChange = { newValue ->
                        // Filtrer pour accepter uniquement les chiffres et un point décimal
                        val filtered = newValue.filter { it.isDigit() || it == '.' }
                        // Empêcher plusieurs points décimaux
                        if (filtered.count { it == '.' } <= 1) {
                            priceText = filtered
                        }
                    },
                    label = { Text("Prix (CAD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = priceText.isNotEmpty() && (priceText.toDoubleOrNull() == null || priceText.toDoubleOrNull()!! < 0),
                    supportingText = if (priceText.isNotEmpty() && (priceText.toDoubleOrNull() == null || priceText.toDoubleOrNull()!! < 0)) {
                        { Text("Le prix doit être positif", fontSize = 10.sp) }
                    } else null
                )

                Spacer(modifier = Modifier.height(12.dp))

                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Catégorie") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        categories.forEach { selectedCategory ->
                            DropdownMenuItem(
                                text = { Text(selectedCategory) },
                                onClick = {
                                    category = selectedCategory
                                    expanded = false
                                }
                            )
                        }
                    }
                }

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
                            val price = priceText.toDoubleOrNull()
                            if (name.isNotBlank() && description.isNotBlank() && price != null && price >= 0) {
                                viewModel.addMenuItem(
                                    restaurantId = restaurantId,
                                    name = name,
                                    description = description,
                                    price = price,
                                    category = category
                                )
                            }
                        },
                        enabled = name.isNotBlank() && description.isNotBlank() && 
                                  priceText.toDoubleOrNull() != null && 
                                  (priceText.toDoubleOrNull() ?: -1.0) >= 0 && 
                                  !managementState.isLoading
                    ) {
                        if (managementState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Ajouter")
                        }
                    }
                }
            }
        }
    }
}

// Dialog pour modifier un menu
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditMenuDialog(
    menu: Menu,
    viewModel: RestaurantManagementViewModel,
    managementState: RestaurantManagementState,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf(menu.name) }
    var description by remember { mutableStateOf(menu.description) }
    var priceText by remember { mutableStateOf(menu.price.toString()) }
    var category by remember { mutableStateOf(menu.category) }
    var expanded by remember { mutableStateOf(false) }
    
    val categories = listOf("Entrée", "Plat", "Dessert", "Boisson", "Accompagnement", "Autre")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Modifier le menu",
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
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 14.sp
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nom du plat") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = priceText,
                    onValueChange = { newValue ->
                        // Filtrer pour accepter uniquement les chiffres et un point décimal
                        val filtered = newValue.filter { it.isDigit() || it == '.' }
                        // Empêcher plusieurs points décimaux
                        if (filtered.count { it == '.' } <= 1) {
                            priceText = filtered
                        }
                    },
                    label = { Text("Prix (CAD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = priceText.isNotEmpty() && (priceText.toDoubleOrNull() == null || priceText.toDoubleOrNull()!! < 0),
                    supportingText = if (priceText.isNotEmpty() && (priceText.toDoubleOrNull() == null || priceText.toDoubleOrNull()!! < 0)) {
                        { Text("Le prix doit être positif", fontSize = 10.sp) }
                    } else null
                )

                Spacer(modifier = Modifier.height(12.dp))

                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Catégorie") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        categories.forEach { selectedCategory ->
                            DropdownMenuItem(
                                text = { Text(selectedCategory) },
                                onClick = {
                                    category = selectedCategory
                                    expanded = false
                                }
                            )
                        }
                    }
                }

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
                            val price = priceText.toDoubleOrNull()
                            if (name.isNotBlank() && description.isNotBlank() && price != null && price >= 0) {
                                viewModel.updateMenuItem(
                                    menuId = menu.id,
                                    name = name,
                                    description = description,
                                    price = price,
                                    category = category
                                )
                            }
                        },
                        enabled = name.isNotBlank() && description.isNotBlank() && 
                                  priceText.toDoubleOrNull() != null && 
                                  (priceText.toDoubleOrNull() ?: -1.0) >= 0 && 
                                  !managementState.isLoading
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

// Dialog pour supprimer un menu
@Composable
fun DeleteMenuDialog(
    menu: Menu,
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
            Text("Supprimer le menu ?")
        },
        text = {
            Column {
                Text("Êtes-vous sûr de vouloir supprimer \"${menu.name}\" ?")
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "⚠️ Cette action est irréversible.",
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
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { viewModel.deleteMenuItem(menu.id) },
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

/**
 * Barre de recherche pour les menus.
 */
@Composable
fun MenuSearchBar(
    searchQuery: String,
    onSearchQueryChanged: (String) -> Unit
) {
    OutlinedTextField(
        value = searchQuery,
        onValueChange = onSearchQueryChanged,
        label = { Text("Rechercher dans le menu...") },
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

/**
 * Section des avis pour un restaurant.
 */
@Composable
fun ReviewsSection(
    restaurant: Restaurant,
    userReview: com.example.foufoufood4.data.model.Review?,
    canModifyReviews: Boolean = true, // Par défaut, peut modifier
    onAddReviewClick: () -> Unit,
    onEditReviewClick: () -> Unit,
    onDeleteReviewClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
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
                    text = "Avis",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                // Afficher les boutons d'action uniquement si l'utilisateur peut modifier les avis
                if (canModifyReviews) {
                    if (userReview == null) {
                        Button(
                            onClick = onAddReviewClick,
                            modifier = Modifier.height(36.dp)
                        ) {
                            Icon(
                                Icons.Default.Star,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Noter", fontSize = 12.sp)
                        }
                    } else {
                        Row {
                            TextButton(
                                onClick = onEditReviewClick,
                                modifier = Modifier.height(36.dp)
                            ) {
                                Icon(
                                    Icons.Default.Edit,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Modifier", fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            TextButton(
                                onClick = onDeleteReviewClick,
                                modifier = Modifier.height(36.dp),
                                colors = ButtonDefaults.textButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            ) {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Afficher les avis existants
            if (restaurant.reviews.isNullOrEmpty()) {
                Text(
                    text = "Aucun avis pour le moment.",
                    color = Color.Gray,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            } else {
                restaurant.reviews.take(5).forEach { review ->
                    ReviewItem(review = review)
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                if (restaurant.reviews.size > 5) {
                    Text(
                        text = "... et ${restaurant.reviews.size - 5} autres avis",
                        color = Color.Gray,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

/**
 * Item d'un avis individuel.
 */
@Composable
fun ReviewItem(review: com.example.foufoufood4.data.model.Review) {
    // Debug log
    android.util.Log.d("ReviewItem", "Review - userId: ${review.user}, userName: ${review.userName}, rating: ${review.rating}")
    
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Nom de l'utilisateur si disponible
            if (!review.userName.isNullOrBlank()) {
                Text(
                    text = review.userName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(end = 8.dp)
                )
            } else {
                // Afficher "Client" si le nom n'est pas disponible
                Text(
                    text = "Client",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(end = 8.dp)
                )
            }
            
            // Affichage des étoiles pour la note
            if (review.rating != null) {
                Row {
                    repeat(5) { index ->
                        Icon(
                            imageVector = if (index < review.rating) Icons.Default.Star else Icons.Default.StarBorder,
                            contentDescription = null,
                            tint = if (index < review.rating) Color(0xFFFFD700) else Color.Gray,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Date si disponible
            review.createdAt?.let { date ->
                Text(
                    text = date.take(10), // Afficher seulement la date (YYYY-MM-DD)
                    color = Color.Gray,
                    fontSize = 12.sp
                )
            }
        }
        
        // Commentaire
        if (!review.comment.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = review.comment,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

/**
 * Dialog pour ajouter ou modifier un avis.
 */
@Composable
fun ReviewDialog(
    restaurantId: String,
    existingReview: com.example.foufoufood4.data.model.Review?,
    viewModel: RestaurantDetailViewModel,
    onDismiss: () -> Unit
) {
    var rating by remember { mutableStateOf(existingReview?.rating ?: 0) }
    var comment by remember { mutableStateOf(existingReview?.comment ?: "") }
    val uiState by viewModel.uiState.collectAsState()
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = if (existingReview == null) "Noter ce restaurant" else "Modifier votre avis",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Sélecteur de note (étoiles)
                Row {
                    repeat(5) { index ->
                        IconButton(
                            onClick = { rating = index + 1 },
                            modifier = Modifier.size(48.dp)
                        ) {
                            Icon(
                                imageVector = if (index < rating) Icons.Default.Star else Icons.Default.StarBorder,
                                contentDescription = "${index + 1} étoiles",
                                tint = if (index < rating) Color(0xFFFFD700) else Color.Gray,
                                modifier = Modifier.size(36.dp)
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Champ de commentaire
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Commentaire (optionnel)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 4,
                    placeholder = { Text("Partagez votre expérience...") }
                )
                
                if (uiState.errorMessage != null) {
                    Spacer(modifier = Modifier.height(8.dp))
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
                                text = uiState.errorMessage ?: "",
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Boutons
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
                            if (rating > 0) {
                                viewModel.addReview(restaurantId, rating, comment.takeIf { it.isNotBlank() })
                                onDismiss()
                            }
                        },
                        enabled = rating > 0 && !uiState.isLoading
                    ) {
                        if (uiState.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text(if (existingReview == null) "Publier" else "Modifier")
                        }
                    }
                }
            }
        }
    }
}

