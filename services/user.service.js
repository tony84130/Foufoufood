import { User } from '../models/user.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { Menu } from '../models/menu.model.js';
import { DeliveryPartner } from '../models/deliveryPartner.model.js';
import bcrypt from 'bcryptjs';
import redisClient from '../config/redis.js';

/**
 * Met à jour le profil d'un utilisateur
 * @param {String} userId - ID de l'utilisateur à mettre à jour
 * @param {Object} updateData - Données à mettre à jour (name, email, password, role, phone, address)
 * @returns {Promise<Object>} Utilisateur mis à jour
 * @throws {Error} Si l'utilisateur n'existe pas, si l'email existe déjà, ou si le rôle ne peut pas être modifié
 */
export const updateUserProfile = async (userId, updateData) => {
    const { name, email, password, role, phone, address } = updateData;
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    if (name) {
        user.name = name;
    }

    if (email && email !== user.email) {
        const normalizedEmail = email.trim().toLowerCase();
        
        const existingUser = await User.findOne({ 
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
            _id: { $ne: userId } // Exclure l'utilisateur actuel
        });
        if (existingUser) {
            const error = new Error('Email already exists');
            error.statusCode = 409;
            throw error;
        }
        user.email = normalizedEmail;
    }

    if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }

    if (role && user.role !== role) {
        const error = new Error('User role cannot be changed.');
        error.statusCode = 400;
        throw error;
    }

    if (phone) {
        user.phone = phone;
    }

    if (address && user.role === 'client') {
        user.address = Object.assign(user.address || {}, address);
    }

    const updatedUser = await user.save();
    return updatedUser;
};

/**
 * Supprime un utilisateur et nettoie toutes ses données associées (MongoDB + Redis)
 * @param {String} userId - ID de l'utilisateur à supprimer
 * @returns {Promise<Object>} Objet de confirmation avec success et message
 * @throws {Error} Si l'utilisateur n'existe pas
 */
export const deleteUserAndCleanup = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const activeJti = await redisClient.get(`active_session:${userId}`);
    await redisClient.del(`active_session:${userId}`);
    
    if (activeJti) {
        await redisClient.del(`blocklist:${activeJti}`);
    }

    if (user.role === 'restaurant_admin' && user.restaurants && user.restaurants.length > 0) {
        await Menu.deleteMany({ restaurant: { $in: user.restaurants } });
        await Restaurant.deleteMany({ _id: { $in: user.restaurants } });
    }

    if (user.role === 'delivery_partner') {
        await DeliveryPartner.deleteOne({ user: user._id });
    }

    await user.deleteOne();

    return { success: true, message: 'User deleted successfully' };
};
