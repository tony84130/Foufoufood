plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
}

android {
    namespace = "com.example.foufoufood4"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.foufoufood4"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {

    // --- Hilt (Dependency Injection) ---
    implementation(libs.hilt.android.core)
    implementation(libs.androidx.hilt.navigation.compose)
    ksp(libs.hilt.compiler)

    // --- Compose & Architecture (Ajouts/Vérifications) ---

    // Nécessaire pour l'intégration du ViewModel avec Compose (ex: la fonction viewModel())
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")

    // Nécessaire pour les Coroutines et le cycle de vie (ex: lifecycleScope)
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")

    // Nécessaire pour l'utilisation des Flows et StateFlow (ex: stateIn)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Coil: Bibliothèque recommandée pour charger des images (si vous voulez afficher les images dans Compose)
    // Remplacerait Glide/Picasso si vous en utilisiez
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Note: 'implementation(libs.androidx.activity.compose)' et les libs Compose sont déjà là.

    // --- Retrofit et Serialization (inchangé) ---

    // Retrofit pour les appels réseau
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    // Convertisseur Gson pour Retrofit (JSON <-> Objets Kotlin)
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")

    // Dépendance Socket.IO Client
    implementation("io.socket:socket.io-client:2.1.0")

    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // --- Base Android & Legacy Views (inchangé) ---

    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation(libs.androidx.core.ktx)
    
    // DataStore Preferences pour une persistance plus fiable que SharedPreferences
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Remplacé par la version spécifique ci-dessus pour la clarté
    // implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    // --- Tests (inchangé) ---

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}