import { Router } from 'express';
import { 
    createOrder, 
    getMyOrders, 
    getOrderById, 
    updateOrderStatus, 
    cancelOrder,
    getAvailableOrders,
    getMyAssignedOrders,
    assignOrderToMe,
    getMyDeliveryHistory,
    getRestaurantOrders
} from '../controllers/order.controller.js';
import { authorize, checkRole } from '../middlewares/auth.middleware.js';

const orderRouter = Router();

// Créer une nouvelle commande (client seulement)
orderRouter.post('/', authorize, checkRole(['client']), createOrder);

// Obtenir les commandes de l'utilisateur actuel (client seulement)
orderRouter.get('/', authorize, checkRole(['client']), getMyOrders);

// Obtenir les commandes d'un restaurant (restaurant_admin, platform_admin)
orderRouter.get('/restaurant', authorize, checkRole(['restaurant_admin', 'platform_admin']), getRestaurantOrders);

// Obtenir les commandes assignées au livreur actuel (delivery_partner seulement)
orderRouter.get('/delivery/me', authorize, checkRole(['delivery_partner']), getMyAssignedOrders);

// Obtenir les commandes disponibles pour les livreurs (delivery_partner seulement)
orderRouter.get('/delivery/available', authorize, checkRole(['delivery_partner']), getAvailableOrders);

// Obtenir l'historique des commandes
orderRouter.get('/delivery/history', authorize, checkRole(['delivery_partner']), getMyDeliveryHistory);

// Obtenir une commande par son ID (client peut voir ses commandes, livreur ses commandes assignées)
orderRouter.get('/:id', authorize, getOrderById);

// Mettre à jour le statut d'une commande (restaurant_admin, delivery_partner, platform_admin)
orderRouter.put('/:id/status', authorize, checkRole(['restaurant_admin', 'delivery_partner', 'platform_admin']), updateOrderStatus);

// Annuler une commande (client, restaurant_admin, platform_admin)
orderRouter.put('/:id/cancel', authorize, checkRole(['client', 'restaurant_admin', 'platform_admin']), cancelOrder);

// Assigner une commande à soi-même (delivery_partner seulement)
orderRouter.post('/:id/assign', authorize, checkRole(['delivery_partner']), assignOrderToMe);

export default orderRouter;