package com.example.foufoufood4.data.model

import com.google.gson.annotations.SerializedName
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import java.lang.reflect.Type

data class OrderItem(
    @SerializedName("menuItem")
    //val menuItemId: String,
    val menuItem: PopulatedMenuItem, // <-- Change type to object
    // You might still have 'menuItemId' from other API calls, keep it if needed
    // val menuItemId: String? = null // Make it nullable if not always present
    val name: String,
    val unitPrice: Double,
    val quantity: Int,
    val total: Double,
    val notes: String = ""
)

data class PopulatedMenuItem(
    @SerializedName("id", alternate = ["_id"]) // Handle both "id" and "_id" from server
    val id: String,
    val name: String
    // Add other fields like description if the server sends them
)

data class DeliveryAddress(
    val line1: String,
    val line2: String? = null,
    val city: String,
    val region: String,
    val postalCode: String,
    val country: String
)

data class Order(
    @SerializedName("id")
    val id: String,
    //val user: String,
    val user: User,
    val restaurant: Restaurant,
    val items: List<OrderItem>,
    val totalPrice: Double,
    val status: String,
    val deliveryAddress: DeliveryAddress,
    val deliveryPartner: DeliveryPartner? = null,
    @SerializedName("createdAt")
    val createdAt: String,
    @SerializedName("updatedAt")
    val updatedAt: String
)

data class DeliveryPartner(
    val id: String,
    val user: String?, // User ID (peut être une string ou extrait d'un objet)
    val userName: String? = null // Nom de l'utilisateur (si disponible après populate)
)

// Deserializer personnalisé pour DeliveryPartner qui gère le cas où user peut être un String ou un objet
class DeliveryPartnerDeserializer : JsonDeserializer<DeliveryPartner> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): DeliveryPartner? {
        if (json == null || !json.isJsonObject) return null
        
        val jsonObject = json.asJsonObject
        
        // Extraire l'ID utilisateur et le nom peu importe le format
        val userElement = jsonObject.get("user")
        val userId: String?
        val userName: String?
        
        when {
            userElement == null -> {
                userId = null
                userName = null
            }
            userElement.isJsonPrimitive && userElement.asJsonPrimitive.isString -> {
                userId = userElement.asString
                userName = null
            }
            userElement.isJsonObject -> {
                val userObj = userElement.asJsonObject
                userId = userObj.get("id")?.asString ?: userObj.get("_id")?.asString
                userName = userObj.get("name")?.asString
            }
            else -> {
                userId = null
                userName = null
            }
        }
        
        return DeliveryPartner(
            id = jsonObject.get("id")?.asString ?: jsonObject.get("_id")?.asString ?: "",
            user = userId,
            userName = userName
        )
    }
}

data class CreateOrderRequest(
    val deliveryAddress: DeliveryAddress,
    val useCart: Boolean = false,
    val restaurantId: String,
    val items: List<OrderItemRequest>
)

