package com.example.foufoufood4.ui.screens.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.foufoufood4.data.model.User
import com.example.foufoufood4.ui.viewmodel.admin.AdminState
import com.example.foufoufood4.ui.viewmodel.admin.AdminViewModel

@Composable
fun UsersListTab(
    viewModel: AdminViewModel,
    uiState: AdminState
) {
    if (uiState.isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    } else if (uiState.users.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text("Aucun utilisateur trouvé", color = Color.Gray)
        }
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            // Statistiques (cartes cliquables pour filtrer)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                UserStatCard(
                    label = "Clients",
                    count = viewModel.getUsersByRole("client").size,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    isSelected = uiState.userRoleFilter == "client",
                    onClick = { 
                        viewModel.setUserRoleFilter(
                            if (uiState.userRoleFilter == "client") null else "client"
                        )
                    }
                )
                UserStatCard(
                    label = "Livreurs",
                    count = viewModel.getUsersByRole("delivery_partner").size,
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    isSelected = uiState.userRoleFilter == "delivery_partner",
                    onClick = { 
                        viewModel.setUserRoleFilter(
                            if (uiState.userRoleFilter == "delivery_partner") null else "delivery_partner"
                        )
                    }
                )
                UserStatCard(
                    label = "Admins",
                    count = viewModel.getUsersByRole("restaurant_admin").size,
                    color = MaterialTheme.colorScheme.tertiaryContainer,
                    isSelected = uiState.userRoleFilter == "restaurant_admin",
                    onClick = { 
                        viewModel.setUserRoleFilter(
                            if (uiState.userRoleFilter == "restaurant_admin") null else "restaurant_admin"
                        )
                    }
                )
            }

            // Message si filtre actif
            if (uiState.userRoleFilter != null) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Filtre actif : ${getRoleLabel(uiState.userRoleFilter!!)}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        TextButton(onClick = { viewModel.setUserRoleFilter(null) }) {
                            Text("Tout afficher")
                        }
                    }
                }
            }

            // Barre de recherche pour les utilisateurs
            UserSearchBar(
                searchQuery = uiState.userSearchQuery,
                onSearchQueryChanged = { query ->
                    viewModel.searchUsers(query)
                }
            )

            // Liste des utilisateurs filtrés
            val filteredUsers = viewModel.getFilteredUsers()
            if (filteredUsers.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Aucun utilisateur trouvé pour ce filtre", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredUsers) { user ->
                        UserCard(
                            user = user,
                            onDeleteClick = { viewModel.showDeleteConfirmation(user) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun UserStatCard(
    label: String, 
    count: Int, 
    color: Color, 
    isSelected: Boolean = false,
    onClick: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .size(100.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) MaterialTheme.colorScheme.primary else color
        ),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = count.toString(),
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimary else Color.Unspecified
            )
            Text(
                text = label,
                fontSize = 12.sp,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimary else Color.Unspecified
            )
        }
    }
}

/**
 * Convertit un rôle technique en label français.
 */
private fun getRoleLabel(role: String): String {
    return when (role) {
        "client" -> "Clients"
        "delivery_partner" -> "Livreurs"
        "restaurant_admin" -> "Admins Restaurant"
        else -> role
    }
}

@Composable
fun UserCard(user: User, onDeleteClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Surface(
                modifier = Modifier.size(48.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = user.getInitials(),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Infos
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = user.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Text(
                    text = user.email,
                    fontSize = 14.sp,
                    color = Color.Gray
                )
                Text(
                    text = user.getRoleDisplayName(),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            // Bouton supprimer
            IconButton(onClick = onDeleteClick) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Supprimer",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
fun DeleteUserConfirmationDialog(
    user: User,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Delete,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
        },
        title = {
            Text("Supprimer l'utilisateur ?")
        },
        text = {
            Column {
                Text("Êtes-vous sûr de vouloir supprimer :")
                Spacer(modifier = Modifier.height(8.dp))
                Text("• ${user.name}", fontWeight = FontWeight.Bold)
                Text("• ${user.email}")
                Text("• Rôle: ${user.getRoleDisplayName()}")
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Cette action est irréversible.",
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.Bold
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
                Text("Supprimer")
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
 * Barre de recherche pour les utilisateurs.
 */
@Composable
fun UserSearchBar(
    searchQuery: String,
    onSearchQueryChanged: (String) -> Unit
) {
    OutlinedTextField(
        value = searchQuery,
        onValueChange = onSearchQueryChanged,
        label = { Text("Rechercher des utilisateurs...") },
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
