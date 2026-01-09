import mongoose from 'mongoose';

const { Schema } = mongoose;

const menuSchema = new Schema(
    {
        name: { 
            type: String, 
            required: [true, 'Menu name is required'],
            trim: true, 
        },
        description: { 
            type: String, 
            trim: true, 
            maxlength: 2000, 
        },
        price: { 
            type: Number, 
            required: [true, 'Menu price is required'],
            min: 0, 
        },
        category: {
            type: String,
            trim: true,
            enum: ['Entrée', 'Plat', 'Dessert', 'Boisson', 'Accompagnement', 'Autre'],
            default: 'Autre',
        },
        image: { 
            type: String, 
            trim: true, 
        }, // URL
        restaurant: {
            // ref à l'id du schéma Restaurant
            type: Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, 'Menu restaurant is required'],
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

export const Menu = mongoose.model('Menu', menuSchema);
