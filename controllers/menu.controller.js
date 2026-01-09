import { Menu } from '../models/menu.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { User } from '../models/user.model.js';

/**
 * Ajoute un item au menu d'un restaurant
 * @param {Object} req - Objet de requête Express contenant restaurantId et les données de l'item dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec l'item créé
 */
export const addMenuItemToRestaurant = async (req, res, next) => {
    try {
        const { restaurantId, ...menuItemData } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID is required' });
        }

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const user = await User.findById(req.user.id);
        const ownsRestaurant = user.restaurants.some(restId => restId.toString() === restaurantId);
        
        if (!ownsRestaurant) {
            return res.status(403).json({ message: 'User not authorized to add menu items to this restaurant' });
        }

        const menuItem = await restaurant.addMenuItem(menuItemData);

        res.status(201).json({ success: true, data: menuItem });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère tous les items du menu d'un restaurant
 * @param {Object} req - Objet de requête Express contenant restaurantId dans req.query
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la liste des items
 */
export const getMenuItems = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID is required as a query parameter' });
        }

        const menuItems = await Menu.find({ restaurant: restaurantId });
        res.status(200).json({ success: true, data: menuItems });
    } catch (error) {
        next(error);
    }
};

/**
 * Recherche des items de menu dans un restaurant par nom, description ou catégorie
 * @param {Object} req - Objet de requête Express contenant restaurantId et q dans req.query
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les items trouvés
 */
export const searchMenuItems = async (req, res, next) => {
    try {
        const { restaurantId, q } = req.query;
        
        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID is required as a query parameter' });
        }

        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(q.trim(), 'i');
        
        const menuItems = await Menu.find({
            restaurant: restaurantId,
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ]
        });

        res.status(200).json({ 
            success: true, 
            data: menuItems,
            searchQuery: q,
            resultsCount: menuItems.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère un item de menu spécifique par son ID
 * @param {Object} req - Objet de requête Express contenant l'ID de l'item dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec l'item trouvé
 */
export const getMenuItemById = async (req, res, next) => {
    try {
        const menuItem = await Menu.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.status(200).json({ success: true, data: menuItem });
    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour un item de menu
 * @param {Object} req - Objet de requête Express contenant l'ID de l'item dans req.params.id et les données à mettre à jour dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec l'item mis à jour
 */
export const updateMenuItem = async (req, res, next) => {
    try {
        const existingMenuItem = await Menu.findById(req.params.id);

        if (!existingMenuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        
        const user = await User.findById(req.user.id);
        const ownsRestaurant = user.restaurants.some(restId => restId.toString() === existingMenuItem.restaurant.toString());
        
        if (!ownsRestaurant) {
            return res.status(403).json({ message: 'User not authorized to update this menu item' });
        }

        if (req.body.restaurant) {
            delete req.body.restaurant;
        }

        // Gérer les champs vides : convertir les chaînes vides en null pour les supprimer
        if (req.body.description !== undefined && (req.body.description === '' || req.body.description === null)) {
            req.body.description = null;
        }
        if (req.body.image !== undefined && (req.body.image === '' || req.body.image === null)) {
            req.body.image = null;
        }

        // Utiliser $set pour mettre à jour uniquement les champs fournis, et $unset pour supprimer les champs null
        const updateData = {};
        const unsetData = {};
        
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === null) {
                unsetData[key] = '';
            } else if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        });

        const updateQuery = {};
        if (Object.keys(updateData).length > 0) {
            updateQuery.$set = updateData;
        }
        if (Object.keys(unsetData).length > 0) {
            updateQuery.$unset = unsetData;
        }

        const menuItem = await Menu.findByIdAndUpdate(req.params.id, updateQuery, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: menuItem });
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime un item de menu
 * @param {Object} req - Objet de requête Express contenant l'ID de l'item dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const deleteMenuItem = async (req, res, next) => {
    try {
        const menuItem = await Menu.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const user = await User.findById(req.user.id);
        const ownsRestaurant = user.restaurants.some(restId => restId.toString() === menuItem.restaurant.toString());
        
        if (!ownsRestaurant) {
            return res.status(403).json({ message: 'User not authorized to delete this menu item' });
        }

        await menuItem.deleteOne();

        res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
        next(error);
    }
};
