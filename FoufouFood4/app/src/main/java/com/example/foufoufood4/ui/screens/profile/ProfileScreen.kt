package com.example.foufoufood4.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.ui.viewmodel.profile.ProfileViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onBackClick: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // Observer logoutSuccess pour déclencher la navigation
    LaunchedEffect(uiState.logoutSuccess) {
        if (uiState.logoutSuccess) {
            onLogout()
        }
    }
    
    // Observer deleteSuccess pour déclencher la navigation
    LaunchedEffect(uiState.deleteSuccess) {
        if (uiState.deleteSuccess) {
            onLogout() // Même comportement que logout : retour à l'écran de connexion
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (uiState.isEditMode) "Modifier le profil" else "Mon Profil") },
                navigationIcon = {
                    IconButton(onClick = {
                        if (uiState.isEditMode) {
                            viewModel.cancelEdit()
                        } else {
                            onBackClick()
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Retour")
                    }
                },
                actions = {
                    if (!uiState.isEditMode) {
                        IconButton(onClick = { viewModel.enableEditMode() }) {
                            Icon(Icons.Default.Edit, "Modifier")
                        }
                        IconButton(onClick = { viewModel.fetchUserProfile() }) {
                            Icon(Icons.Default.Refresh, "Actualiser")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White,
                    actionIconContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading || uiState.isLoggingOut || uiState.isSaving || uiState.isDeleting -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.errorMessage != null && !uiState.logoutSuccess && !uiState.isEditMode && !uiState.deleteSuccess -> {
                    ErrorView(
                        message = uiState.errorMessage!!,
                        onRetry = { viewModel.fetchUserProfile() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.isEditMode && uiState.user != null -> {
                    ProfileEditContent(
                        state = uiState,
                        onFieldChange = { field, value -> viewModel.updateField(field, value) },
                        onSave = { viewModel.saveProfile() },
                        onCancel = { viewModel.cancelEdit() }
                    )
                }
                uiState.user != null -> {
                    ProfileContent(
                        user = uiState.user!!,
                        onLogout = { viewModel.logout() },
                        onDeleteAccount = { viewModel.showDeleteConfirmation() }
                    )
                }
            }
            
            // Boîte de dialogue de confirmation de suppression
            if (uiState.showDeleteConfirmation && uiState.user != null) {
                DeleteAccountConfirmationDialog(
                    userRole = uiState.user!!.role,
                    onConfirm = { viewModel.deleteAccount() },
                    onDismiss = { viewModel.hideDeleteConfirmation() }
                )
            }
        }
    }
}

@Composable
fun ProfileContent(
    user: User,
    onLogout: () -> Unit,
    onDeleteAccount: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Avatar et nom
        ProfileHeader(user)

        Spacer(modifier = Modifier.height(24.dp))

        // Informations de l'utilisateur
        ProfileInfoCard(user)

        Spacer(modifier = Modifier.height(24.dp))

        // Bouton de déconnexion
        Button(
            onClick = onLogout,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Se déconnecter", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Bouton de suppression de compte
        OutlinedButton(
            onClick = onDeleteAccount,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = MaterialTheme.colorScheme.error
            ),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Supprimer mon compte", fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun ProfileHeader(user: User) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(vertical = 16.dp)
    ) {
        // Avatar circulaire avec initiales
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = user.name.firstOrNull()?.uppercase() ?: "U",
                fontSize = 40.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = user.name,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(4.dp))

        // Badge de rôle
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.primaryContainer,
            modifier = Modifier.padding(horizontal = 16.dp)
        ) {
            Text(
                text = user.getRoleDisplayName(),
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
            )
        }
    }
}

@Composable
fun ProfileInfoCard(user: User) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "Informations personnelles",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Email
            ProfileInfoRow(
                icon = Icons.Default.Email,
                label = "Email",
                value = user.email
            )

            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

            // Téléphone
            ProfileInfoRow(
                icon = Icons.Default.Phone,
                label = "Téléphone",
                value = user.phone ?: "Non renseigné"
            )

            // Adresse (uniquement pour les clients)
            if (user.role == "client") {
                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                ProfileInfoRow(
                    icon = Icons.Default.Home,
                    label = "Adresse",
                    value = user.address?.getFullAddress() ?: "Non renseignée"
                )
            }

            // Afficher le nombre de restaurants si c'est un restaurant_admin
            if (user.role == "restaurant_admin" && !user.restaurants.isNullOrEmpty()) {
                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                ProfileInfoRow(
                    icon = Icons.Default.Person,
                    label = "Restaurants gérés",
                    value = "${user.restaurants.size} restaurant(s)"
                )
            }

            // Afficher le nombre de commandes si disponible
            if (!user.orders.isNullOrEmpty()) {
                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
                ProfileInfoRow(
                    icon = Icons.Default.Person,
                    label = "Commandes",
                    value = "${user.orders.size} commande(s)"
                )
            }
        }
    }
}

@Composable
fun ProfileInfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        verticalAlignment = Alignment.Top,
        modifier = Modifier.fillMaxWidth()
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Normal
            )
        }
    }
}

@Composable
fun ErrorView(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Erreur",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Réessayer")
        }
    }
}

/**
 * Boîte de dialogue de confirmation pour la suppression du compte.
 */
@Composable
fun DeleteAccountConfirmationDialog(
    userRole: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    // Définir les éléments à supprimer selon le rôle
    val dataToDelete = buildList {
        add("• Informations personnelles")
        when (userRole) {
            "client" -> {
                add("• Adresse de livraison")
                add("• Historique des commandes")
            }
            "delivery_partner" -> {
                add("• Historique des livraisons")
            }
            "restaurant_admin" -> {
                add("• Restaurants gérés")
                add("• Menus associés")
                add("• Historique des commandes")
            }
            "platform_admin" -> {
                add("• Accès administrateur")
            }
        }
    }

    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Person,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
        },
        title = {
            Text(
                text = "Supprimer le compte ?",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column {
                Text(
                    "Cette action est irréversible. Toutes vos données seront définitivement supprimées :",
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(8.dp))
                dataToDelete.forEach { item ->
                    Text(item)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Êtes-vous sûr de vouloir continuer ?",
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Supprimer définitivement")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Annuler")
            }
        }
    )
}

