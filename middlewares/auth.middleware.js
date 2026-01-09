import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../config/env.js'; 
import redisClient from '../config/redis.js';
import { User } from '../models/user.model.js';

/**
 * Extrait le token JWT de l'en-tête Authorization de la requête
 * @param {Object} req - Objet de requête Express
 * @returns {String|null} Le token JWT ou null si absent
 */
const extractTokenFromHeader = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
};

/**
 * Middleware d'authentification : vérifie et valide le token JWT
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Promise<void>} Appelle next() si authentifié, sinon renvoie une erreur 401
 */
export const authorize = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req);

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decodedForBlocklist = jwt.decode(token);
        if (decodedForBlocklist && decodedForBlocklist.jti) {
            const isBlocked = await redisClient.get(`blocklist:${decodedForBlocklist.jti}`);
            if (isBlocked) {
                return res.status(401).json({ message: 'Token has been revoked (logout).' });
            }
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
};

/**
 * Middleware de vérification des rôles : vérifie que l'utilisateur a l'un des rôles requis
 * @param {Array<String>} roles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 */
export const checkRole = (roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user data' });
    }

    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: `Forbidden: Access requires one of these roles: ${roles.join(', ')}` });
    }

    next();
};

/**
 * Middleware qui empêche l'accès aux routes d'authentification si l'utilisateur est déjà connecté
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Promise<void>} Appelle next() si non connecté, sinon renvoie une erreur 400
 */
export const preventIfLoggedIn = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req);

        if (!token) {
            return next();
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            // Token invalide ou expiré, on permet la connexion
            return next();
        }

        // Vérifier si le token est dans la blocklist
        const isBlocked = await redisClient.get(`blocklist:${decoded.jti}`);
        if (isBlocked) {
            // Token révoqué, on permet la connexion
            return next();
        }

        // Vérifier si une session active existe dans Redis pour cet utilisateur
        const activeSessionJti = await redisClient.get(`active_session:${decoded.userId}`);
        
        // Si une session active existe ET que le JTI correspond, alors l'utilisateur est connecté
        if (activeSessionJti && activeSessionJti === decoded.jti) {
            const user = await User.findById(decoded.userId);
            if (user) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already logged in.'
                });
            }
        }

        // Pas de session active ou JTI ne correspond pas, on permet la connexion
        return next();
    } catch (error) {
        // En cas d'erreur, on permet la connexion pour ne pas bloquer l'utilisateur
        return next();
    }
};