import { notificationService } from '../services/notification.service.js';

// @desc    Récupère toutes les notifications de l'utilisateur
// @route   GET /api/notifications
// @access  Private (Client)
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id.toString(); // S'assurer que c'est une string
        const limit = parseInt(req.query.limit) || 50;
        
        console.log(`📬 Récupération des notifications pour l'utilisateur: ${userId}`);
        const notifications = await notificationService.getUserNotifications(userId, limit);
        console.log(`📬 ${notifications.length} notifications trouvées pour l'utilisateur ${userId}`);
        
        res.json({
            success: true,
            data: notifications,
            count: notifications.length
        });

    } catch (error) {
        console.error('❌ Erreur API /notifications:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur lors de la récupération des notifications.' 
        });
    }
};

// @desc    Vérifie s'il y a des notifications non lues (dans Redis)
// @route   GET /api/notifications/pending
// @access  Private (Client)
export const checkPendingNotifications = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        const notifications = await notificationService.getUserNotifications(userId);
        
        res.json({
            hasNewOrderNotification: notifications.length > 0,
            count: notifications.length
        });

    } catch (error) {
        console.error('❌ Erreur API /notifications/pending:', error.message);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification des notifications.' });
    }
};


// @desc    Supprime toutes les notifications non lues (Marque tout comme lu)
// @route   DELETE /api/notifications/clear
// @access  Private (Client)
export const clearNotifications = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        await notificationService.clearAllNotifications(userId); 
        
        res.status(200).json({ 
            message: 'Notifications effacées avec succès.',
            success: true
        });

    } catch (error) {
        console.error('❌ Erreur API /notifications/clear:', error.message);
        res.status(500).json({ message: "Erreur serveur lors de l'effacement des notifications." });
    }
};