import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { registerUser } from '../services/auth.service.js';

/**
 * Crée un utilisateur de test et retourne son token
 * @param {Object} userData - Données de l'utilisateur (optionnel)
 * @returns {Promise<Object>} Objet contenant user et token
 */
export async function createTestUser(userData = {}) {
    const defaultUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'client',
        ...userData,
    };

    const { token, user } = await registerUser(
        defaultUser.name,
        defaultUser.email,
        defaultUser.password,
        defaultUser.role,
        defaultUser.phone,
        defaultUser.address
    );

    return { user, token };
}

/**
 * Crée un utilisateur admin de test
 * Note: Les admins ne peuvent pas être créés via registerUser, on les crée directement
 * @returns {Promise<Object>} Objet contenant user et token
 */
export async function createTestAdmin() {
    const jwt = (await import('jsonwebtoken')).default;
    const { JWT_SECRET } = await import('../config/env.js');
    const bcrypt = (await import('bcryptjs')).default;
    const { v4: uuidv4 } = await import('uuid');
    
    const email = `admin${Date.now()}@example.com`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
        name: 'Admin User',
        email,
        password: hashedPassword,
        role: 'platform_admin',
    });
    
    const jti = uuidv4();
    const token = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '24h', jwtid: jti }
    );
    
    return { user, token };
}

/**
 * Crée un restaurant admin de test
 * Note: Les restaurant_admin ne peuvent pas être créés via registerUser, on les crée directement
 * @returns {Promise<Object>} Objet contenant user et token
 */
export async function createTestRestaurantAdmin() {
    const jwt = (await import('jsonwebtoken')).default;
    const { JWT_SECRET } = await import('../config/env.js');
    const bcrypt = (await import('bcryptjs')).default;
    const { v4: uuidv4 } = await import('uuid');
    
    const email = `restaurantadmin${Date.now()}@example.com`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
        name: 'Restaurant Owner',
        email,
        password: hashedPassword,
        role: 'restaurant_admin',
    });
    
    const jti = uuidv4();
    const token = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '24h', jwtid: jti }
    );
    
    return { user, token };
}

/**
 * Crée un delivery partner de test
 * @returns {Promise<Object>} Objet contenant user et token
 */
export async function createTestDeliveryPartner() {
    return createTestUser({
        name: 'Delivery Partner',
        email: `delivery${Date.now()}@example.com`,
        role: 'delivery_partner',
    });
}

/**
 * Fait une requête authentifiée avec supertest
 * @param {Function} method - Méthode HTTP (get, post, put, delete)
 * @param {String} url - URL de la route
 * @param {String} token - Token JWT
 * @param {Object} body - Corps de la requête (optionnel)
 * @returns {Promise<Object>} Réponse de supertest
 */
export function authenticatedRequest(method, url, token, body = null) {
    const req = request(app)[method](url).set('Authorization', `Bearer ${token}`);
    if (body) {
        req.send(body);
    }
    return req;
}

/**
 * Obtient un token via l'API (pour les tests d'intégration)
 * @param {String} email - Email de l'utilisateur
 * @param {String} password - Mot de passe
 * @returns {Promise<String>} Token JWT
 */
export async function getTokenViaAPI(email, password) {
    const response = await request(app)
        .post('/foufoufood/auth/sign-in')
        .send({ email, password });

    return response.body.data?.token;
}

