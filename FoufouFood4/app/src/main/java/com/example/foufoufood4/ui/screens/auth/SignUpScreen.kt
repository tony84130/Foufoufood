package com.example.foufoufood4.ui.screens.auth

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.foufoufood4.ui.viewmodel.auth.SignUpViewModel

@Composable
fun SignUpScreen(
    viewModel: SignUpViewModel = hiltViewModel(),
    onSignUpSuccess: () -> Unit
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()

    // Déclaration de l'état pour les champs de texte
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    // Gestion des effets de l'état
    LaunchedEffect(uiState) {
        when {
            uiState.isSuccess -> {
                Toast.makeText(context, "Compte créé avec succès!", Toast.LENGTH_SHORT).show()
                onSignUpSuccess()
            }
            uiState.errorMessage != null -> {
                Toast.makeText(context, uiState.errorMessage, Toast.LENGTH_LONG).show()
                viewModel.resetState()
            }
        }
    }

    // Pour la gestion du défilement lorsque le clavier apparaît
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .verticalScroll(scrollState)
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // En-tête
        Spacer(modifier = Modifier.height(32.dp))
        Text(
            text = "Foofood Client",
            color = Color.Black,
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 32.dp)
        )
        Text(
            text = "Création de votre compte",
            color = Color.Black,
            fontSize = 16.sp,
            modifier = Modifier.padding(bottom = 32.dp, top = 8.dp)
        )

        // Champs de saisie
        SignupTextField(
            value = name,
            onValueChange = { name = it },
            label = "Nom_Utilisateur"
        )
        Spacer(modifier = Modifier.height(16.dp))

        SignupTextField(
            value = email,
            onValueChange = { email = it },
            label = "email@domain.com"
        )
        Spacer(modifier = Modifier.height(16.dp))

        SignupTextField(
            value = password,
            onValueChange = { password = it },
            label = "Mot_de_passe",
            isPassword = true
        )
        Spacer(modifier = Modifier.height(16.dp))

        SignupTextField(
            value = confirmPassword,
            onValueChange = { confirmPassword = it },
            label = "Confirmer_Mot_de_passe",
            isPassword = true
        )
        Spacer(modifier = Modifier.height(48.dp))

        // Boutons d'inscription
        SignupButton(
            text = "S'inscrire en tant que Livreur",
            onClick = {
                viewModel.signUp(name, email, password, confirmPassword, "delivery")
            },
            isLoading = uiState.isLoading
        )
        Spacer(modifier = Modifier.height(16.dp))

        SignupButton(
            text = "S'inscrire en tant que Consommateur",
            onClick = {
                viewModel.signUp(name, email, password, confirmPassword, "client")
            },
            isLoading = uiState.isLoading
        )
    }
}

@Composable
fun SignupTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    isPassword: Boolean = false
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Color.Black,
            unfocusedBorderColor = Color.LightGray
        ),
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None
    )
}

@Composable
fun SignupButton(text: String, onClick: () -> Unit, isLoading: Boolean = false) {
    Button(
        onClick = onClick,
        enabled = !isLoading,
        colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                modifier = Modifier.size(24.dp)
            )
        } else {
            Text(text, color = Color.White, fontSize = 16.sp)
        }
    }
}

