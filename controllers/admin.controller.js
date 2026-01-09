import { createRestaurantAndAdmin } from '../services/admin.service.js';

/**
 * Crée un restaurant et son administrateur associé
 * @param {Object} req - Objet de requête Express contenant les données validées dans req.validatedData
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} Envoie une réponse JSON
 */
export const createRestaurantWithAdmin = async (req, res, next) => {
    try {
        // Les données ont déjà été validées et transformées par le middleware
        const restaurantData = req.validatedData;

        const result = await createRestaurantAndAdmin(restaurantData);

        res.status(201).json({
            success: true,
            message: 'Restaurant and its admin created successfully. The admin can now log in with their credentials.',
            data: {
                restaurant: result.restaurant.toJSON(),
                admin: result.admin.toJSON(),
            },
        });

    } catch (error) {
        next(error);
    }
};
