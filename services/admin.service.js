import bcrypt from 'bcryptjs';

import { Restaurant } from '../models/restaurant.model.js';
import { User } from '../models/user.model.js';

/**
 * Crée un restaurant et son administrateur associé (ou associe un admin existant au restaurant)
 * @param {Object} restaurantData - Données du restaurant et de l'admin (restaurantName, restaurantAddress, adminEmail, adminName, adminPassword)
 * @returns {Promise<Object>} Objet contenant le restaurant créé et l'admin (créé ou existant)
 * @throws {Error} Si l'admin existe mais n'a pas le bon rôle, si le nom ne correspond pas, ou si le mot de passe est incorrect
 */
export const createRestaurantAndAdmin = async (restaurantData) => {
    const { 
        restaurantName, 
        restaurantAddress, 
        restaurantCuisine,
        restaurantPhone,
        adminEmail, 
        adminName, 
        adminPassword,
        adminPhone,
        adminAddress
    } = restaurantData;

    // Les validations sont déjà faites dans le middleware
    // On peut directement utiliser les valeurs car elles sont garanties d'être valides
    const normalizedEmail = adminEmail.toLowerCase();

    const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }).select('+password');

    // Construire les données du restaurant avec les champs optionnels
    const restaurantCreateData = {
        name: restaurantName,
        address: restaurantAddress,
    };

    // Ajouter les champs optionnels s'ils sont fournis
    if (restaurantCuisine) {
        restaurantCreateData.cuisine = restaurantCuisine;
    }
    if (restaurantPhone) {
        restaurantCreateData.phone = restaurantPhone;
    }

    const newRestaurant = await Restaurant.create(restaurantCreateData);

    let admin;

    if (existingUser) {
        if (existingUser.role !== 'restaurant_admin') {
            await Restaurant.deleteOne({ _id: newRestaurant._id });
            const error = new Error('A user with this email already exists but is not a restaurant admin.');
            error.statusCode = 409; 
            throw error;
        }

        if (existingUser.name !== adminName) {
            await Restaurant.deleteOne({ _id: newRestaurant._id });
            const error = new Error(`The admin name provided ('${adminName}') does not match the existing admin name ('${existingUser.name}') for this email.`);
            error.statusCode = 400;
            throw error;
        }

        const isPasswordValid = await bcrypt.compare(adminPassword, existingUser.password);
        if (!isPasswordValid) {
            await Restaurant.deleteOne({ _id: newRestaurant._id });
            const error = new Error('The password provided does not match the existing admin password for this email.');
            error.statusCode = 401;
            throw error;
        }

        if (!existingUser.restaurants) {
            existingUser.restaurants = [];
        }
        existingUser.restaurants.push(newRestaurant._id);
        
        await existingUser.save({ validateModifiedOnly: true });
        
        existingUser.password = undefined;

        admin = existingUser;
    } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminData = {
            name: adminName,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'restaurant_admin',
            restaurants: [newRestaurant._id],
        };

        // Ajouter les champs optionnels s'ils sont fournis
        if (adminPhone) {
            adminData.phone = adminPhone;
        }
        if (adminAddress) {
            adminData.address = adminAddress;
        }

        admin = await User.create(adminData);
    }

    newRestaurant.adminUser = admin._id;
    await newRestaurant.save();

    return {
        restaurant: newRestaurant,
        admin: admin,
    };
};
