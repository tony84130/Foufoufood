import { Restaurant } from '../models/restaurant.model.js';
import { User } from '../models/user.model.js';
import { Menu } from '../models/menu.model.js';

/**
 * Crée un nouveau restaurant associé à l'utilisateur authentifié
 * @param {Object} req - Objet de requête Express contenant name et address dans req.body et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le restaurant créé
 */
export const createRestaurant = async (req, res, next) => {
    try {
        const { name, address } = req.body;

        if (!name || !address) {
            return res.status(400).json({ message: 'Name and address are required' });
        }

        const restaurantData = { 
            name, 
            address,
            adminUser: req.user.id
        };

        const restaurant = await Restaurant.create(restaurantData);

        await User.findByIdAndUpdate(req.user.id, {
            $push: { restaurants: restaurant._id }
        });

        res.status(201).json({ success: true, data: restaurant });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère la liste de tous les restaurants
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la liste des restaurants
 */
export const getRestaurants = async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find().populate('menu');
        res.status(200).json({ success: true, data: restaurants });
    } catch (error) {
        next(error);
    }
};

/**
 * Recherche des restaurants par nom, adresse ou type de cuisine
 * @param {Object} req - Objet de requête Express contenant le paramètre de recherche q dans req.query
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les restaurants trouvés
 */
export const searchRestaurants = async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(q.trim(), 'i');
        
        const restaurants = await Restaurant.find({
            $or: [
                { name: searchRegex },
                { address: searchRegex },
                { cuisine: searchRegex }
            ]
        }).populate('menu');

        res.status(200).json({ 
            success: true, 
            data: restaurants,
            searchQuery: q,
            resultsCount: restaurants.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère tous les restaurants appartenant à l'utilisateur authentifié
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les restaurants de l'utilisateur
 */
export const getMyRestaurants = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'restaurants',
            populate: [
                { path: 'menu' },
                { path: 'reviews.user', select: 'name email' }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user.restaurants || [] });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère un restaurant spécifique par son ID
 * @param {Object} req - Objet de requête Express contenant l'ID du restaurant dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le restaurant trouvé
 */
export const getRestaurantById = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .populate('menu')
            .populate('reviews.user', 'name email');

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour les informations d'un restaurant
 * @param {Object} req - Objet de requête Express contenant l'ID du restaurant dans req.params.id et les données à mettre à jour dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le restaurant mis à jour
 */
export const updateRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const user = await User.findById(req.user.id);
        const ownsRestaurant = user.restaurants.some(restId => restId.toString() === req.params.id);
        
        if (!ownsRestaurant) {
            return res.status(403).json({ message: 'User not authorized to update this restaurant' });
        }

        if (req.body.adminUser) {
            delete req.body.adminUser;
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        res.status(200).json({ success: true, data: updatedRestaurant });
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime un restaurant et tous ses menus associés
 * @param {Object} req - Objet de requête Express contenant l'ID du restaurant dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const deleteRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (req.user.role === 'restaurant_admin') {
            const user = await User.findById(req.user.id);
            const ownsRestaurant = user.restaurants.some(restId => restId.toString() === req.params.id);
            
            if (!ownsRestaurant) {
                return res.status(403).json({ message: 'User not authorized to delete this restaurant' });
            }
        }

        await Menu.deleteMany({ restaurant: req.params.id });

        if (restaurant.adminUser) {
            await User.findByIdAndUpdate(restaurant.adminUser, {
                $pull: { restaurants: req.params.id }
            });
        }

        await restaurant.deleteOne();

        res.status(200).json({ success: true, message: 'Restaurant deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Ajoute ou met à jour un avis pour un restaurant
 * @param {Object} req - Objet de requête Express contenant l'ID du restaurant dans req.params.id, rating et comment dans req.body, et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le restaurant mis à jour
 */
export const addRestaurantReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const { id: restaurantId } = req.params;

        if (!rating) {
            return res.status(400).json({ message: 'Rating is required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const existingReviewIndex = restaurant.reviews.findIndex(
            review => review.user.toString() === req.user.id
        );

        const reviewData = {
            user: req.user.id,
            rating: Number(rating),
            comment: comment || ''
        };

        if (existingReviewIndex !== -1) {
            restaurant.reviews[existingReviewIndex] = {
                ...restaurant.reviews[existingReviewIndex].toObject(),
                ...reviewData
            };
        } else {
            restaurant.reviews.push(reviewData);
        }

        restaurant.recalculateRating();

        await restaurant.save();

        await restaurant.populate('reviews.user', 'name email');

        res.status(201).json({ 
            success: true, 
            message: existingReviewIndex !== -1 ? 'Review updated successfully' : 'Review added successfully',
            data: restaurant 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Supprime un avis d'un restaurant
 * @param {Object} req - Objet de requête Express contenant l'ID du restaurant dans req.params.id et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const deleteRestaurantReview = async (req, res, next) => {
    try {
        const { id: restaurantId } = req.params;

        const restaurant = await Restaurant.findById(restaurantId);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const reviewIndex = restaurant.reviews.findIndex(
            review => review.user.toString() === req.user.id
        );

        if (reviewIndex === -1) {
            return res.status(404).json({ message: 'Review not found' });
        }

        restaurant.reviews.splice(reviewIndex, 1);

        restaurant.recalculateRating();

        await restaurant.save();

        await restaurant.populate('reviews.user', 'name email');

        res.status(200).json({ 
            success: true, 
            message: 'Review deleted successfully',
            data: restaurant 
        });
    } catch (error) {
        next(error);
    }
};
