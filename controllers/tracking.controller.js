import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { DeliveryPartner } from '../models/deliveryPartner.model.js';
import { emailService } from '../services/email.service.js';
import { notificationService } from '../services/notification.service.js';
import { cartService } from '../services/cart.service.js';

/**
 * Récupère les détails d'une commande pour le suivi avec toutes les informations formatées
 * @param {Object} req - Objet de requête Express contenant orderId dans req.params.id et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les données de suivi formatées
 */
export const getOrderTracking = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findById(orderId)
            .populate('restaurant', 'name cuisine address phone')
            .populate('deliveryPartner.user', 'name phone')
            .populate('items.menuItem', 'name description image')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }

        if (order.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé à cette commande'
            });
        }

        const trackingData = {
            order: {
                id: order._id || order.id,
                status: order.status,
                totalPrice: order.totalPrice,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                deliveryAddress: order.deliveryAddress,
                specialInstructions: order.specialInstructions
            },
            restaurant: {
                name: order.restaurant.name,
                cuisine: order.restaurant.cuisine,
                address: order.restaurant.address,
                phone: order.restaurant.phone
            },
            items: order.items.map(item => ({
                name: item.menuItem.name,
                description: item.menuItem.description,
                image: item.menuItem.image,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                notes: item.notes
            })),
            deliveryPartner: order.deliveryPartner ? {
                name: order.deliveryPartner.user.name,
                phone: order.deliveryPartner.user.phone,
                vehicle: order.deliveryPartner.vehicle,
                licensePlate: order.deliveryPartner.licensePlate
            } : null,
            statusHistory: order.statusHistory || [],
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            actualDeliveryTime: order.actualDeliveryTime
        };

        res.status(200).json({
            success: true,
            data: trackingData
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Récupère toutes les commandes d'un utilisateur avec suivi et pagination
 * @param {Object} req - Objet de requête Express contenant status, limit, page dans req.query et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les commandes formatées et la pagination
 */
export const getUserOrdersWithTracking = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, limit = 10, page = 1 } = req.query;

        const filter = { user: userId };
        if (status) {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('restaurant', 'name cuisine address phone')
            .populate('deliveryPartner.user', 'name phone')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const formattedOrders = orders.map(order => ({
            id: order.id,
            status: order.status,
            totalPrice: order.totalPrice,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            restaurant: {
                name: order.restaurant.name,
                cuisine: order.restaurant.cuisine
            },
            deliveryPartner: order.deliveryPartner ? {
                name: order.deliveryPartner.user.name,
                phone: order.deliveryPartner.user.phone
            } : null,
            itemCount: order.items.length,
            estimatedDeliveryTime: order.estimatedDeliveryTime
        }));

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalOrders: total,
                    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour le statut d'une commande avec gestion des notifications et historique
 * @param {Object} req - Objet de requête Express contenant orderId dans req.params.id, status et notes dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec le statut mis à jour
 */
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Vérifier les permissions
        if (!['restaurant_admin', 'platform_admin', 'delivery_partner'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Permissions insuffisantes pour modifier le statut'
            });
        }

        const order = await Order.findById(orderId)
            .populate('user', 'name email phone')
            .populate('restaurant', 'name')
            .populate('deliveryPartner.user', 'name phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }

        const oldStatus = order.status;

        order.status = status;
        order.updatedAt = new Date();

        if (!order.statusHistory) {
            order.statusHistory = [];
        }

        order.statusHistory.push({
            status,
            changedBy: userId,
            changedAt: new Date(),
            notes: notes || ''
        });

        if (status === 'En livraison') {
            order.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        } else if (status === 'Livrée') {
            order.actualDeliveryTime = new Date();
        }

        await order.save();

        try {
            await emailService.sendStatusUpdateNotification(order, order.user, oldStatus, status);
            await notificationService.sendStatusUpdate(order.user.id, order, oldStatus, status);
        } catch (notificationError) {
            console.error('Erreur envoi notifications:', notificationError.message);
        }

        res.status(200).json({
            success: true,
            data: {
                order: {
                    id: order.id,
                    status: order.status,
                    updatedAt: order.updatedAt,
                    statusHistory: order.statusHistory
                }
            },
            message: 'Statut de la commande mis à jour avec succès'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Récupère les notifications de l'utilisateur authentifié
 * @param {Object} req - Objet de requête Express contenant limit dans req.query et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les notifications
 */
export const getUserNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        const notifications = await notificationService.getUserNotifications(userId, parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                notifications,
                count: notifications.length
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Marque une notification spécifique comme lue
 * @param {Object} req - Objet de requête Express contenant notificationId dans req.params.id et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const markNotificationAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        await notificationService.markNotificationAsRead(userId, notificationId);

        res.status(200).json({
            success: true,
            message: 'Notification marquée comme lue'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Récupère les statistiques de suivi d'une commande (temps écoulé, historique, etc.)
 * @param {Object} req - Objet de requête Express contenant orderId dans req.params.id et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les statistiques
 */
export const getOrderStats = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findById(orderId)
            .populate('restaurant', 'name')
            .populate('deliveryPartner.user', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Commande non trouvée'
            });
        }

        if (order.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Accès non autorisé'
            });
        }

        const now = new Date();
        const createdAt = new Date(order.createdAt);
        const timeElapsed = Math.floor((now - createdAt) / (1000 * 60)); // minutes

        const stats = {
            orderId: order.id,
            status: order.status,
            timeElapsed: {
                minutes: timeElapsed,
                hours: Math.floor(timeElapsed / 60)
            },
            restaurant: {
                name: order.restaurant.name
            },
            deliveryPartner: order.deliveryPartner ? {
                name: order.deliveryPartner.user.name
            } : null,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            actualDeliveryTime: order.actualDeliveryTime,
            statusHistory: order.statusHistory || []
        };

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Envoie une notification de test pour le développement
 * @param {Object} req - Objet de requête Express contenant message dans req.body et req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON de confirmation
 */
export const testNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { message } = req.body;

        notificationService.sendTestNotification(userId, message || 'Test de notification');

        res.status(200).json({
            success: true,
            message: 'Notification de test envoyée'
        });

    } catch (error) {
        next(error);
    }
};
