import { Router } from 'express';
import { createRestaurant, getRestaurants, searchRestaurants, getMyRestaurants, getRestaurantById, updateRestaurant, deleteRestaurant, addRestaurantReview, deleteRestaurantReview } from '../controllers/restaurant.controller.js';
import { authorize, checkRole } from '../middlewares/auth.middleware.js';

const restaurantRouter = Router();

// Créer un restaurant (seul restaurant_admin peut créer ses propres restaurants)
restaurantRouter.post('/', authorize, checkRole(['restaurant_admin']), createRestaurant);

// Obtenir tous les restaurants (public)
restaurantRouter.get('/', getRestaurants);

// Rechercher des restaurants (public)
restaurantRouter.get('/search', searchRestaurants);

// Obtenir les restaurants de l'utilisateur actuel (restaurant_admin seulement) - DOIT être avant /:id
restaurantRouter.get('/me', authorize, checkRole(['restaurant_admin']), getMyRestaurants);

// Ajouter ou mettre à jour un avis pour un restaurant (client seulement) - DOIT être avant /:id pour éviter les conflits
restaurantRouter.post('/:id/reviews', authorize, checkRole(['client']), addRestaurantReview);

// Supprimer un avis d'un restaurant (client seulement)
restaurantRouter.delete('/:id/reviews', authorize, checkRole(['client']), deleteRestaurantReview);

// Obtenir un restaurant par son ID (public)
restaurantRouter.get('/:id', getRestaurantById);

// Mettre à jour un restaurant (seul le restaurant_admin peut modifier ses propres restaurants)
restaurantRouter.put('/:id', authorize, checkRole(['restaurant_admin']), updateRestaurant);

// Supprimer un restaurant (restaurant_admin peut supprimer ses propres restaurants, platform_admin peut supprimer n'importe lequel)
restaurantRouter.delete('/:id', authorize, checkRole(['restaurant_admin', 'platform_admin']), deleteRestaurant);

export default restaurantRouter;
