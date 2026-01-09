import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import redisClient from '../config/redis.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config/env.js';
import { User } from '../models/user.model.js';
import { DeliveryPartner } from '../models/deliveryPartner.model.js';

/**
 * Enregistre un nouvel utilisateur dans le système
 * @param {String} name - Nom de l'utilisateur
 * @param {String} email - Email de l'utilisateur (sera normalisé en minuscules)
 * @param {String} password - Mot de passe en clair (sera hashé)
 * @param {String} role - Rôle de l'utilisateur (par défaut: 'client', peut être 'client' ou 'delivery_partner')
 * @param {String|null} phone - Numéro de téléphone (optionnel)
 * @param {Object|null} address - Adresse de l'utilisateur (optionnel)
 * @returns {Promise<Object>} Objet contenant le token JWT et l'utilisateur créé
 * @throws {Error} Si l'utilisateur existe déjà ou si le rôle est invalide
 */

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 604800

export const registerUser = async (name, email, password, role = 'client', phone = null, address = null) => {
    // Validation des champs requis
    if (!email || typeof email !== 'string' || email.trim() === '') {
        const error = new Error('Email is required');
        error.statusCode = 400;
        throw error;
    }

    if (!password || typeof password !== 'string') {
        const error = new Error('Password is required');
        error.statusCode = 400;
        throw error;
    }

    // Validation de la longueur du mot de passe AVANT le hash
    if (password.length < 6) {
        const error = new Error('Password must be at least 6 characters long');
        error.statusCode = 400;
        throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    if (existingUser) {
        const error = new Error('User already exists');
        error.statusCode = 409;
        throw error;
    }

    const allowedRoles = ['client', 'delivery_partner'];
    if (!allowedRoles.includes(role)) {
        const error = new Error('Invalid role specified. Only client and delivery_partner roles are allowed for public registration.');
        error.statusCode = 400;
        throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role
    };

    if (phone) {
        userData.phone = phone;
    }

    if (address) {
        userData.address = address;
    }

    const newUser = await User.create(userData);

    if (role === 'delivery_partner') {
        await DeliveryPartner.create({ user: newUser._id });
    }

    const jti = uuidv4();
    const token = jwt.sign(
        { userId: newUser._id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN, jwtid: jti } // JWT_EXPIRES_IN DOIT être réglé sur '7d' ou plus
    );

    // Utilisez une valeur suffisamment grande, correspondant au minimum à JWT_EXPIRES_IN
    await redisClient.set(`active_session:${newUser._id}`, jti, { EX: SEVEN_DAYS_IN_SECONDS });

    return { token, user: newUser };
};

/**
 * Authentifie un utilisateur existant et crée une nouvelle session
 * @param {String} email - Email de l'utilisateur (sera normalisé en minuscules)
 * @param {String} password - Mot de passe en clair
 * @returns {Promise<Object>} Objet contenant le token JWT et l'utilisateur authentifié
 * @throws {Error} Si l'utilisateur n'existe pas ou si le mot de passe est incorrect
 */
export const loginUser = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }).select('+password');
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        const error = new Error('Invalid password');
        error.statusCode = 401;
        throw error;
    }

    const activeSession = await redisClient.get(`active_session:${user._id}`);
    if (activeSession) {
        const isOldSessionBlocked = await redisClient.get(`blocklist:${activeSession}`);
        
        if (!isOldSessionBlocked) {
            // activeSession contient le jti de l'ancien token
            // On bloque ce jti avec une expiration par défaut (JWT_EXPIRES_IN)
            // Pour simplifier, on utilise SEVEN_DAYS_IN_SECONDS comme expiration
            await redisClient.set(`blocklist:${activeSession}`, 'revoked', { EX: SEVEN_DAYS_IN_SECONDS });
            console.log(`Old session revoked for user ${user._id} to allow new login`);
        }
    }

    const jti = uuidv4();
    const token = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN, jwtid: jti } // JWT_EXPIRES_IN DOIT être réglé sur '7d' ou plus
    );

    // Synchroniser l'expiration de la session Redis avec une valeur longue (7 jours)
    await redisClient.set(`active_session:${user._id}`, jti, { EX: SEVEN_DAYS_IN_SECONDS });

    user.password = undefined;

    return { token, user };
};

/**
 * Déconnecte un utilisateur en révoquant son token de session
 * @param {String} token - Token JWT à révoquer
 * @returns {Promise<void>} Ne retourne rien
 */
export const logoutUser = async (token) => {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.jti || !decoded.exp) {
        return;
    }

    const { jti, exp, userId } = decoded;
    const key = `blocklist:${jti}`;
    const remainingTime = exp - Math.floor(Date.now() / 1000);

    if (remainingTime > 0) {
        await redisClient.set(key, 'revoked', { EX: remainingTime });
        await redisClient.del(`active_session:${userId}`);
    }
};
