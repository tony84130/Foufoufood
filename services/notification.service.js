import { Server } from 'socket.io';
import redisClient from '../config/redis.js'; // Assurez-vous que le chemin est correct

class NotificationService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
    }

    /**
     * Initialise le service de notifications avec Socket.IO
     * @param {Object} server - Serveur HTTP
     */
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });

        this.setupEventHandlers();
        console.log('✅ Service de notifications temps réel initialisé');
    }

    /**
     * Configure les gestionnaires d'événements Socket.IO
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Utilisateur connecté: ${socket.id}`);

            // Authentification de l'utilisateur
            socket.on('authenticate', (data) => {
                // NOTE: Idéalement, la validation du token JWT devrait être faite ici.
                const { userId, token } = data;
                if (userId && token) { 
                    this.connectedUsers.set(userId, socket.id);
                    socket.userId = userId;
                    console.log(`✅ Utilisateur authentifié: ${userId}`);
                    
                    // Rejoindre la room de l'utilisateur
                    socket.join(`user_${userId}`);
                    
                    socket.emit('authenticated', { success: true });
                } else {
                    socket.emit('authentication_error', { message: 'Données d\'authentification manquantes' });
                }
            });

            // Déconnexion
            socket.on('disconnect', () => {
                if (socket.userId) {
                    this.connectedUsers.delete(socket.userId);
                    console.log(`🔌 Utilisateur déconnecté: ${socket.userId}`);
                }
            });

            // Rejoindre une room de commande
            socket.on('join_order', (orderId) => {
                socket.join(`order_${orderId}`);
                console.log(`📦 Utilisateur ${socket.userId} suit la commande ${orderId}`);
            });

            // Quitter une room de commande
            socket.on('leave_order', (orderId) => {
                socket.leave(`order_${orderId}`);
                console.log(`📦 Utilisateur ${socket.userId} ne suit plus la commande ${orderId}`);
            });
        });
    }

    /**
     * Envoie une notification de confirmation de commande
     * @param {String} userId - ID de l'utilisateur
     * @param {Object} order - Commande créée
     */
    async sendOrderConfirmation(userId, order) {
        try {
            // Notification temps réel
            this.io.to(`user_${userId}`).emit('order_confirmed', {
                type: 'order_confirmation',
                orderId: order.id,
                message: 'Votre commande a été confirmée !',
                order: {
                    id: order.id,
                    status: order.status,
                    restaurant: order.restaurant.name,
                    totalPrice: order.totalPrice,
                    createdAt: order.createdAt
                }
            });

            // Stocker la notification dans Redis
            await this.storeNotification(userId, {
                type: 'order_confirmation',
                orderId: order.id,
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notification de confirmation envoyée à l'utilisateur ${userId}`);
        } catch (error) {
            console.error('❌ Erreur envoi notification confirmation:', error.message);
        }
    }

    /**
     * Envoie une notification de changement de statut
     * @param {String} userId - ID de l'utilisateur
     * @param {Object} order - Commande mise à jour
     * @param {String} oldStatus - Ancien statut
     * @param {String} newStatus - Nouveau statut
     */
    async sendStatusUpdate(userId, order, oldStatus, newStatus) {
        try {
            const statusMessages = {
                'En attente': 'Votre commande est en attente de confirmation',
                'Confirmée': 'Votre commande a été confirmée par le restaurant',
                'Préparée': 'Votre commande est prête et sera bientôt en livraison',
                'En livraison': 'Votre commande est en cours de livraison',
                'Livrée': 'Votre commande a été livrée avec succès !',
                'Annulée': 'Votre commande a été annulée'
            };

            // Notification temps réel
            this.io.to(`user_${userId}`).emit('status_updated', {
                type: 'status_update',
                orderId: order.id,
                oldStatus,
                newStatus,
                message: statusMessages[newStatus],
                order: {
                    id: order.id,
                    status: newStatus,
                    restaurant: order.restaurant.name,
                    deliveryPartner: order.deliveryPartner
                }
            });

            // Notification dans la room de la commande
            this.io.to(`order_${order.id}`).emit('order_status_changed', {
                orderId: order.id,
                status: newStatus,
                message: statusMessages[newStatus]
            });

            // Stocker la notification dans Redis
            await this.storeNotification(userId, {
                type: 'status_update',
                orderId: order.id,
                oldStatus,
                newStatus,
                message: statusMessages[newStatus],
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notification de statut envoyée à l'utilisateur ${userId}: ${oldStatus} → ${newStatus}`);
        } catch (error) {
            console.error('❌ Erreur envoi notification statut:', error.message);
        }
    }

    /**
     * Envoie une notification d'attribution de livreur
     * @param {String} userId - ID de l'utilisateur
     * @param {Object} order - Commande
     * @param {Object} deliveryPartner - Livreur assigné
     */
    async sendDeliveryAssignment(userId, order, deliveryPartner) {
        try {
            // Notification temps réel
            this.io.to(`user_${userId}`).emit('delivery_assigned', {
                type: 'delivery_assignment',
                orderId: order.id,
                message: 'Un livreur a été assigné à votre commande !',
                deliveryPartner: {
                    name: deliveryPartner.user.name,
                    phone: deliveryPartner.user.phone
                },
                order: {
                    id: order.id,
                    status: order.status,
                    restaurant: order.restaurant.name
                }
            });

            // Stocker la notification dans Redis
            await this.storeNotification(userId, {
                type: 'delivery_assignment',
                orderId: order.id,
                message: 'Un livreur a été assigné à votre commande !',
                deliveryPartner: {
                    name: deliveryPartner.user.name,
                    phone: deliveryPartner.user.phone
                },
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notification d'attribution de livreur envoyée à l'utilisateur ${userId}`);
        } catch (error) {
            console.error('❌ Erreur envoi notification attribution:', error.message);
        }
    }

    /**
     * Envoie une notification de livraison
     * @param {String} userId - ID de l'utilisateur
     * @param {Object} order - Commande livrée
     */
    async sendDeliveryNotification(userId, order) {
        try {
            // Notification temps réel
            console.log(`➡️ [NOTIF_CALL] Tentative d'envoi de confirmation de livraison pour la commande ${order.id} à l'utilisateur ${userId}`);
            this.io.to(`user_${userId}`).emit('order_delivered', {
                type: 'delivery_complete',
                orderId: order.id,
                message: 'Votre commande a été livrée avec succès !',
                order: {
                    id: order.id,
                    status: order.status,
                    restaurant: order.restaurant.name,
                    deliveredAt: new Date().toISOString()
                }
            });

            // Stocker la notification dans Redis
            await this.storeNotification(userId, {
                type: 'delivery_complete',
                orderId: order.id,
                message: 'Votre commande a été livrée avec succès !',
                timestamp: new Date().toISOString()
            });

            console.log(`📧 Notification de livraison envoyée à l'utilisateur ${userId}`);
        } catch (error) {
            console.error('❌ Erreur envoi notification livraison:', error.message);
        }
    }

    /**
     * Stocke une notification dans Redis
     * @param {String} userId - ID de l'utilisateur
     * @param {Object} notification - Données de la notification
     */
    async storeNotification(userId, notification) {
        try {
            // S'assurer que userId est une string
            const userIdStr = userId.toString();
            const key = `notifications:${userIdStr}`;
            // Ajouter un ID unique si non présent
            if (!notification.id) {
                notification.id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            // Ajouter un timestamp si non présent
            if (!notification.timestamp) {
                notification.timestamp = new Date().toISOString();
            }
            // Marquer comme non lue par défaut
            if (notification.read === undefined) {
                notification.read = false;
            }
            console.log(`💾 Stockage notification pour l'utilisateur ${userIdStr} avec la clé: ${key}`);
            await redisClient.lPush(key, JSON.stringify(notification));
            await redisClient.expire(key, 7 * 24 * 60 * 60); // 7 jours
            console.log(`✅ Notification stockée avec succès pour ${userIdStr}`);
        } catch (error) {
            console.error('❌ Erreur stockage notification:', error.message);
        }
    }

    /**
     * Récupère les notifications d'un utilisateur
     * @param {String} userId - ID de l'utilisateur
     * @param {Number} limit - Nombre de notifications à récupérer
     * @returns {Array} Liste des notifications
     */
    async getUserNotifications(userId, limit = 50) {
        try {
            // S'assurer que userId est une string
            const userIdStr = userId.toString();
            const key = `notifications:${userIdStr}`;
            console.log(`🔍 Recherche des notifications avec la clé: ${key}`);
            const notifications = await redisClient.lRange(key, 0, limit - 1);
            const parsed = notifications.map(notification => {
                try {
                    return JSON.parse(notification);
                } catch (e) {
                    console.error('Erreur parsing notification:', e);
                    return null;
                }
            }).filter(n => n !== null);
            console.log(`📬 ${parsed.length} notifications récupérées depuis Redis pour ${userIdStr}`);
            return parsed;
        } catch (error) {
            console.error('❌ Erreur récupération notifications:', error.message);
            return [];
        }
    }

    /**
     * Supprime toutes les notifications stockées dans Redis pour cet utilisateur (NOUVELLE FONCTION)
     * Cette fonction est utilisée par l'API REST /notifications/clear
     * @param {String} userId - ID de l'utilisateur
     */
    async clearAllNotifications(userId) {
        try {
            const key = `notifications:${userId}`;
            // DEL est la commande Redis pour supprimer une clé.
            await redisClient.del(key); 
            console.log(`🗑️ Notifications Redis effacées pour l'utilisateur ${userId}`);
        } catch (error) {
            console.error('❌ Erreur suppression notifications Redis:', error.message);
        }
    }

    /**
     * Marque une notification comme lue (méthode non utilisée pour le badge, mais existante)
     * @param {String} userId - ID de l'utilisateur
     * @param {String} notificationId - ID de la notification
     */
    async markNotificationAsRead(userId, notificationId) {
        try {
            const key = `notifications:${userId}`;
            const notifications = await redisClient.lRange(key, 0, -1);
            
            for (let i = 0; i < notifications.length; i++) {
                const notification = JSON.parse(notifications[i]);
                if (notification.id === notificationId) {
                    notification.read = true;
                    await redisClient.lSet(key, i, JSON.stringify(notification));
                    break;
                }
            }
        } catch (error) {
            console.error('❌ Erreur marquage notification:', error.message);
        }
    }

    /**
     * Envoie une notification de test
     * @param {String} userId - ID de l'utilisateur
     * @param {String} message - Message de test
     */
    sendTestNotification(userId, message = 'Test de notification') {
        this.io.to(`user_${userId}`).emit('test_notification', {
            type: 'test',
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Obtient les statistiques des connexions
     * @returns {Object} Statistiques
     */
    getConnectionStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            totalSockets: this.io.sockets.sockets.size,
            rooms: Array.from(this.io.sockets.adapter.rooms.keys())
        };
    }
}

export const notificationService = new NotificationService();