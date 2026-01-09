import { User } from '../models/user.model.js';
import { updateUserProfile, deleteUserAndCleanup } from '../services/user.service.js';

// @desc    Get details of the currently logged-in user (Profile Screen)
// @route   GET /foufoufood/users/profile
// @access  Private (Authenticated users)
export const getCurrentUser = async (req, res, next) => {
    try {
        // L'ID utilisateur est stocké dans req.user.id par le middleware d'autorisation
        const userId = req.user.id; 

        // Chercher l'utilisateur, exclure le mot de passe, et populer les données nécessaires
        const user = await User.findById(userId)
            .select('-password')
            // Assurez-vous d'ajouter ici les populate nécessaires pour la page de profil
            // Ex: pour afficher le nombre de commandes ou les restaurants gérés
            .populate('orders') 
            .populate('restaurants');

        if (!user) {
            // Le token était valide, mais l'utilisateur a été supprimé entre-temps
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });

    } catch (error) {
        // En cas d'erreur de base de données ou de populate
        next(error);
    }
};

/**
 * Récupère la liste de tous les utilisateurs
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la liste des utilisateurs
 */
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find();

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

/**
 * Recherche des utilisateurs par nom, email ou rôle
 * @param {Object} req - Objet de requête Express contenant le paramètre de recherche q dans req.query
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les utilisateurs trouvés
 */
export const searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(q.trim(), 'i');
        
        const users = await User.find({
            $or: [
                { name: searchRegex },
                { email: searchRegex },
                { role: searchRegex }
            ]
        }).select('-password');

        res.status(200).json({ 
            success: true, 
            data: users,
            searchQuery: q,
            resultsCount: users.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère les informations d'un utilisateur spécifique par son ID
 * @param {Object} req - Objet de requête Express contenant l'ID utilisateur dans req.params.id et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les données utilisateur
 */
export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }

        if (req.user.role !== 'platform_admin' && req.user.id !== user.id) {
            const error = new Error('Forbidden: You can only view your own profile');
            error.status = 403;
            throw error;
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour le profil de l'utilisateur actuellement authentifié
 * @param {Object} req - Objet de requête Express contenant les données à mettre à jour dans req.body et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec l'utilisateur mis à jour
 */
export const updateCurrentUser = async (req, res, next) => {
    try {
        const updatedUser = await updateUserProfile(req.user.id, req.body);
        res.status(200).json({ success: true, data: updatedUser.toJSON() });
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime le compte de l'utilisateur actuellement authentifié et nettoie toutes les données associées
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const deleteCurrentUser = async (req, res, next) => {
    try {
        const result = await deleteUserAndCleanup(req.user.id);
        // Important: déconnexion manuelle après suppression pour s'assurer que le token n'est plus utilisable
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime un utilisateur par son ID et nettoie toutes ses données associées
 * @param {Object} req - Objet de requête Express contenant l'ID utilisateur dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const deleteUser = async (req, res, next) => {
    try {
        const result = await deleteUserAndCleanup(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
