import mongoose from 'mongoose';

const { Schema } = mongoose;

const deliveryPartnerSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            trim: true,
            unique: true, 
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

export const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
