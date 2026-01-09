import express from 'express';
import { 
    getOrderTracking, 
    getUserOrdersWithTracking, 
    updateOrderStatus, 
    getUserNotifications, 
    markNotificationAsRead, 
    getOrderStats, 
    testNotifications 
} from '../controllers/tracking.controller.js';
import { authorize, checkRole } from '../middlewares/auth.middleware.js';

const trackingRouter = express.Router();

// Routes pour le suivi des commandes (clients)
trackingRouter.get('/orders', authorize, checkRole(['client']), getUserOrdersWithTracking);
trackingRouter.get('/orders/:orderId', authorize, checkRole(['client']), getOrderTracking);
trackingRouter.get('/orders/:orderId/stats', authorize, checkRole(['client']), getOrderStats);
trackingRouter.get('/notifications', authorize, checkRole(['client']), getUserNotifications);
trackingRouter.put('/notifications/:notificationId/read', authorize, checkRole(['client']), markNotificationAsRead);

// Routes pour la mise à jour des statuts (admins/restaurants/livreurs)
trackingRouter.put('/orders/:orderId/status', authorize, checkRole(['restaurant_admin', 'platform_admin', 'delivery_partner']), updateOrderStatus);

// Route de test pour les notifications
trackingRouter.post('/test-notifications', authorize, testNotifications);

export default trackingRouter;
