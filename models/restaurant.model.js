import mongoose from 'mongoose';

const { Schema } = mongoose;

const openingHoursSchema = new Schema(
    {
        // Ex: { day: 'Mon', open: '09:00', close: '21:00' }
        day: {
            type: String,
            enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            required: true,
        },
        open: {
            type: String,
            required: true
        },  // HH:mm
        close: {
            type: String,
            required: true
        }, // HH:mm
    },
    { _id: false }
);

const reviewSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 1000
        },
    },
    { timestamps: true }
);

const restaurantSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        cuisine: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        openingHours: [openingHoursSchema],
        // Liste des items de menu liés
        menu: [{
            type: Schema.Types.ObjectId,
            ref: 'Menu'
        }],
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        adminUser: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        reviews: [reviewSchema],
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

// Méthode d’instance: ajoute un item de menu et relie au restaurant
restaurantSchema.methods.addMenuItem = async function (menuItemData) {
    const Menu = this.model('Menu');
    const menuItem = await Menu.create({
        ...menuItemData,
        restaurant: this._id,
    });
    this.menu.push(menuItem._id);
    await this.save();
    return menuItem;
};

// Recalcule la note moyenne à partir des reviews
restaurantSchema.methods.recalculateRating = function () {
    if (!this.reviews?.length) {
        this.rating = 0;
    } else {
        const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
    }
    return this.rating;
};



export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
