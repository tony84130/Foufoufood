import { Router } from 'express';
import { addMenuItemToRestaurant, getMenuItems, searchMenuItems, getMenuItemById, updateMenuItem, deleteMenuItem } from '../controllers/menu.controller.js';
import { authorize, checkRole } from '../middlewares/auth.middleware.js';

const menuRouter = Router();

// Ajouter un plat à un restaurant (restaurant_admin seulement)
menuRouter.post('/', authorize, checkRole(['restaurant_admin']), addMenuItemToRestaurant);

// Obtenir tous les plats d'un restaurant (public)
menuRouter.get('/', getMenuItems);

// Rechercher des plats dans un restaurant (public)
menuRouter.get('/search', searchMenuItems);

// Obtenir un plat par son ID (public)
menuRouter.get('/:id', getMenuItemById);

// Mettre à jour un plat (restaurant_admin seulement)
menuRouter.put('/:id', authorize, checkRole(['restaurant_admin']), updateMenuItem);

// Supprimer un plat (restaurant_admin seulement)
menuRouter.delete('/:id', authorize, checkRole(['restaurant_admin']), deleteMenuItem);

export default menuRouter;
