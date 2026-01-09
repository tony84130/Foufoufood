package com.example.foufoufood4.ui.activity

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.foufoufood4.R
import com.example.foufoufood4.data.local.SessionManager // NOUVEL IMPORT
import com.example.foufoufood4.ui.activity.auth.WelcomeActivity
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject // NOUVEL IMPORT
// ANCIEN IMPORT: import com.example.foufoufood4.ui.activity.MenuActivity
import com.example.foufoufood4.ui.activity.restaurant.RestaurantListActivity // NOUVEL IMPORT DE LA LISTE DE RESTAURANTS

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    // INJECTION DU SESSION MANAGER VIA HILT
    @Inject
    lateinit var sessionManager: SessionManager

    // CORRECTION : Utilisation de RestaurantListActivity comme écran principal
    private val mainScreenClass = RestaurantListActivity::class.java


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. VÉRIFIER L'ÉTAT D'AUTHENTIFICATION
        val authToken = sessionManager.fetchAuthToken()

        val destinationActivity = if (authToken.isNullOrBlank()) {
            // Pas de token : aller à l'écran de bienvenue/connexion
            WelcomeActivity::class.java
        } else {
            // Token présent : aller directement à l'écran principal (Liste de restaurants)
            mainScreenClass
        }

        val intent = Intent(this, destinationActivity)
        startActivity(intent)
        finish() // Termine MainActivity pour qu'elle ne soit pas dans la pile de retour
    }
}

// Les fonctions Composable MainScreen et ImagePlaceholder restent inchangées

@Composable
fun MainScreen(
    imageTopId: Int,
    imageBottomId: Int,
    onSignUpClick: () -> Unit,
    onSignInClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = "Foofood Client",
            color = Color.Black,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 64.dp, bottom = 32.dp)
        )

        ImagePlaceholder(imageId = imageTopId)

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onSignUpClick,
            colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
            shape = MaterialTheme.shapes.small,
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .padding(bottom = 16.dp)
        ) {
            Text("S'inscrire", color = Color.White)
        }

        Button(
            onClick = onSignInClick,
            colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
            shape = MaterialTheme.shapes.small,
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .padding(bottom = 16.dp)
        ) {
            Text("Se Connecter", color = Color.White)
        }

        Spacer(modifier = Modifier.weight(1f))

        ImagePlaceholder(imageId = imageBottomId)

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun ImagePlaceholder(imageId: Int) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .background(Color.LightGray.copy(alpha = 0.3f)),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = imageId),
            contentDescription = "Image de décoration",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )
    }
}
