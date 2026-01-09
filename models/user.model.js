import mongoose from 'mongoose';

const { Schema } = mongoose;

const addressSchema = new Schema(
    {
        line1: {
            type: String,
            trim: true,
        },
        line2: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        region: {
            type: String,
            trim: true,
        }, // province/etat
        postalCode: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
    }, 
    { _id: false }
);

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'User name is required'],
            trim: true,
            minlength: 2,
        },
        email: {
            type: String,
            required: [true, 'User email is required'],
            trim: true,
            lowercase: true,
            unique: true,
            match: [/\S+@\S+\.\S+/, 'Please fill a valid email adress'],
        },
        password: {
            type: String,
            required: [true, 'User password is required'],
            minlength: 6,
            select: false,
        },
        phone: {
            type: String,
            trim: true,
        },
        address: addressSchema,
        role: {
            type: String,
            enum: ['client', 'delivery_partner', 'restaurant_admin', 'platform_admin'],
            default: 'client'
        },
        restaurants: [{
            type: Schema.Types.ObjectId,
            ref: 'Restaurant'
        }],
        orders: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Order',
            }
        ],
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret._id;
                delete ret.__v;
                delete ret.password;
                return ret;
            }
        },
    }
);

export const User = mongoose.model('User', userSchema);
