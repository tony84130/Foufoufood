import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
    {
        menuItem: {
            type: Schema.Types.ObjectId,
            ref: 'Menu',
            required: true,
        },
        name: { 
            type: String, 
            trim: true 
        }, // snapshot au moment de la commande
        unitPrice: { 
            type: Number, 
            required: true, 
            min: 0 
        }, // prix au moment T
        quantity: { 
            type: Number, 
            required: true, 
            min: 1, 
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        notes: { 
            type: String, 
            trim: true, 
            maxlength: 1000 
        }
    },
    { _id: false }
);

const deliveryAddressSchema = new Schema(
    {
        line1: {
            type: String,
            required: [true, 'Delivery line1 street is required'],
            trim: true
        },
        line2: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: [true, 'Delivery city is required'],
            trim: true
        },
        region: {
            type: String,
            required: [true, 'Delivery region is required'],
            trim: true
        }, // province/etat
        postalCode: {
            type: String,
            required: [true, 'Delivery postal code is required'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Delivery country is required'],
            trim: true
        },
    },
    { _id: false }
);

const orderSchema = new Schema(
    {
        user: {
            // ref à l'id du schéma User
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        restaurant: {
            // ref à l'id du schéma Restaurant
            type: Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        items: {
            type: [orderItemSchema],
            validate: [(arr) => arr.length > 0, 'La commande doit avoir au moins un item'],
            required: true
        },
        totalPrice: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        status: {
            type: String,
            enum: ['En attente', 'Confirmée', 'Préparée', 'En livraison', 'Livrée', 'Annulée'],
            default: 'En attente',
        },
        deliveryAddress: deliveryAddressSchema,
        deliveryPartner: { 
            type: Schema.Types.ObjectId, 
            ref: 'DeliveryPartner' 
        },
    },
    {
        timestamps: true, 
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Calcul de totalPrice si non fourni, et total des items
orderSchema.pre('validate', function (next) {
  if (this.items?.length) {
    this.items = this.items.map((it) => ({
      ...it,
      total:
        typeof it.total === 'number' && it.total >= 0
          ? it.total
          : Number((it.unitPrice * it.quantity).toFixed(2)),
    }));
    if (typeof this.totalPrice !== 'number' || this.totalPrice <= 0) {
      this.totalPrice = this.items.reduce((s, it) => s + it.total, 0);
    }
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
