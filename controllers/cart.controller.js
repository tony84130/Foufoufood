import { cartService } from '../services/cart.service.js';

/**
 * Récupère le panier de l'utilisateur authentifié
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le panier
 */
export const getCart = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req.user.id);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        next(error);
    }
};

/**
 * Ajoute un item au panier de l'utilisateur authentifié
 * @param {Object} req - Objet de requête Express contenant menuItemId, quantity et notes dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le panier mis à jour
 */
export const addToCart = async (req, res, next) => {
    try {
        const { menuItemId, quantity = 1, notes = '' } = req.body;

        if (!menuItemId) {
            return res.status(400).json({ message: 'Menu item ID is required' });
        }

        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }

        const cart = await cartService.addToCart(req.user.id, menuItemId, quantity, notes);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour la quantité d'un item dans le panier
 * @param {Object} req - Objet de requête Express contenant menuItemId dans req.params et quantity dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le panier mis à jour
 */
export const updateCartItem = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 0) {
            return res.status(400).json({ message: 'Quantity cannot be negative' });
        }

        const cart = await cartService.updateCartItem(req.user.id, menuItemId, quantity);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime un item du panier
 * @param {Object} req - Objet de requête Express contenant menuItemId dans req.params
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le panier mis à jour
 */
export const removeFromCart = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;
        const cart = await cartService.removeFromCart(req.user.id, menuItemId);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        next(error);
    }
};

/**
 * Vide complètement le panier de l'utilisateur authentifié
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le panier vide
 */
export const clearCart = async (req, res, next) => {
    try {
        const cart = await cartService.clearCart(req.user.id);
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère les statistiques du panier (nombre d'items, prix total, etc.)
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les statistiques
 */
export const getCartStats = async (req, res, next) => {
    try {
        const stats = await cartService.getCartStats(req.user.id);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

/**
 * Valide le panier avant le passage en caisse (vérifie disponibilité des items et prix)
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le panier validé
 */
export const validateCart = async (req, res, next) => {
    try {
        const validatedCart = await cartService.validateCart(req.user.id);
        res.status(200).json({ success: true, data: validatedCart });
    } catch (error) {
        next(error);
    }
};
