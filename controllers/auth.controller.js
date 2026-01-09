import { registerUser, loginUser, logoutUser } from '../services/auth.service.js';

/**
 * Inscrit un nouvel utilisateur dans le système
 * @param {Object} req - Objet de requête Express contenant name, email, password, role, phone, address dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le token et les données utilisateur
 */
export const signUp = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, address } = req.body;
        const { token, user } = await registerUser(name, email, password, role, phone, address);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                token,
                user: user.toJSON(),
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Authentifie un utilisateur existant et génère un token de session
 * @param {Object} req - Objet de requête Express contenant email et password dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le token et les données utilisateur
 */
export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await loginUser(email, password);

        res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            data: {
                token,
                user: user.toJSON(),
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Déconnecte un utilisateur en révoquant son token de session
 * @param {Object} req - Objet de requête Express contenant le token dans req.headers.authorization
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const signOut = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token || token.trim() === '') {
            return res.status(400).json({ success: false, message: 'Aucun token fourni.' });
        }

        await logoutUser(token);

        res.status(200).json({
            success: true,
            message: 'User signed out successfully',
        });
    } catch (error) {
        next(error);
    }
};