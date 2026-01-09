import express from 'express';
import { authorize } from '../middlewares/auth.middleware.js'; 
import { 
    checkPendingNotifications, 
    clearNotifications,
    getNotifications
} from '../controllers/notification.controller.js'; // <-- Import du contrôleur

const router = express.Router();

/**
 * @route GET /api/notifications
 * @description Récupère toutes les notifications de l'utilisateur.
 * @access Private (Client)
 */
router.get('/', authorize, getNotifications);

/**
 * @route GET /api/notifications/pending
 * @description Vérifie s'il y a des notifications non lues.
 * @access Private (Client)
 */
router.get('/pending', authorize, checkPendingNotifications);


/**
 * @route DELETE /api/notifications/clear
 * @description Supprime toutes les notifications non lues.
 * @access Private (Client)
 */
router.delete('/clear', authorize, clearNotifications);

export default router;