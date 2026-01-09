package com.example.foufoufood4.data.model

data class OpeningHours(
    val day: String,  // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    val open: String, // HH:mm format
    val close: String // HH:mm format
) {
    fun getDayDisplayName(): String {
        return when (day) {
            "Mon" -> "Lundi"
            "Tue" -> "Mardi"
            "Wed" -> "Mercredi"
            "Thu" -> "Jeudi"
            "Fri" -> "Vendredi"
            "Sat" -> "Samedi"
            "Sun" -> "Dimanche"
            else -> day
        }
    }

    fun getFormattedHours(): String {
        return "${getDayDisplayName()}: $open - $close"
    }
}

