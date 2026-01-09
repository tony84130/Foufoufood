package com.example.foufoufood4.ui.screens.admin

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.ui.activity.MainActivity
import com.example.foufoufood4.ui.activity.profile.ProfileActivity
import com.example.foufoufood4.ui.viewmodel.admin.AdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    viewModel: AdminViewModel = hiltViewModel(),
    onBackClick: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Administration", fontWeight = FontWeight.Bold) },
                actions = {
                    // Bouton Profile
                    IconButton(onClick = {
                        context.startActivity(Intent(context, ProfileActivity::class.java))
                    }) {
                        Icon(Icons.Default.Person, contentDescription = "Profil")
                    }
                    
                    // Bouton Refresh
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Actualiser")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tabs - Adaptés selon le rôle
            TabRow(selectedTabIndex = uiState.selectedTab) {
                if (uiState.currentUserRole == "platform_admin") {
                    // Platform admin : Utilisateurs, Restaurants, Créer
                    Tab(
                        selected = uiState.selectedTab == 0,
                        onClick = { viewModel.selectTab(0) },
                        text = { Text("Utilisateurs") },
                        icon = { Icon(Icons.Default.Person, contentDescription = null) }
                    )
                    Tab(
                        selected = uiState.selectedTab == 1,
                        onClick = { viewModel.selectTab(1) },
                        text = { Text("Restaurants") },
                        icon = { Icon(Icons.Default.Home, contentDescription = null) }
                    )
                    Tab(
                        selected = uiState.selectedTab == 2,
                        onClick = { viewModel.selectTab(2) },
                        text = { Text("Créer") },
                        icon = { Icon(Icons.Default.Add, contentDescription = null) }
                    )
                } else {
                    // Restaurant admin : Restaurants seulement
                    Tab(
                        selected = uiState.selectedTab == 0,
                        onClick = { viewModel.selectTab(0) },
                        text = { Text("Mes Restaurants") },
                        icon = { Icon(Icons.Default.Home, contentDescription = null) }
                    )
                }
            }

            // Messages de succès/erreur
            if (uiState.successMessage != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(uiState.successMessage!!, modifier = Modifier.weight(1f))
                        IconButton(onClick = { viewModel.clearMessages() }) {
                            Icon(Icons.Default.Close, contentDescription = "Fermer")
                        }
                    }
                }
            }

            if (uiState.errorMessage != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(uiState.errorMessage!!, modifier = Modifier.weight(1f))
                        IconButton(onClick = { viewModel.clearMessages() }) {
                            Icon(Icons.Default.Close, contentDescription = "Fermer")
                        }
                    }
                }
            }

            // Contenu selon l'onglet sélectionné et le rôle
            if (uiState.currentUserRole == "platform_admin") {
                // Platform admin
                when (uiState.selectedTab) {
                    0 -> UsersListTab(viewModel = viewModel, uiState = uiState)
                    1 -> RestaurantsListTab(viewModel = viewModel, uiState = uiState)
                    2 -> CreateRestaurantAdminTab(viewModel = viewModel, uiState = uiState)
                }
            } else {
                // Restaurant admin
                when (uiState.selectedTab) {
                    0 -> RestaurantsListTab(viewModel = viewModel, uiState = uiState)
                }
            }

            // Dialog de confirmation de suppression
            if (uiState.showDeleteConfirmation && uiState.userToDelete != null) {
                DeleteUserConfirmationDialog(
                    user = uiState.userToDelete!!,
                    onConfirm = { viewModel.deleteUser() },
                    onDismiss = { viewModel.hideDeleteConfirmation() }
                )
            }
        }
    }
}

