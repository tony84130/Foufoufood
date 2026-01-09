import { Menu } from '../models/menu.model.js';
import { Order } from '../models/order.model.js';
import { DeliveryPartner } from '../models/deliveryPartner.model.js';
import { User } from '../models/user.model.js';
// Changement : Importation de l'instance du service de notification Socket.IO
import { notificationService } from '../services/notification.service.js';

class OrderService {
    /**
     * Valide et enrichit les items de commande avec les données du menu
     * @param {Array} items - Les items de la commande
     * @param {String} restaurantId - ID du restaurant
     * @returns {Array} Items validés et enrichis
     */
    async validateAndEnrichOrderItems(items, restaurantId) {
        const validatedItems = [];

        for (const item of items) {
            // Le panier utilise menuItemId, mais la commande utilise menuItem
            const menuItemId = item.menuItemId || item.menuItem;
            const { quantity, notes } = item;

            if (!menuItemId || !quantity || quantity < 1) {
                throw new Error('Invalid item data: menuItemId and quantity are required');
            }

            // Récupérer l'item du menu
            const menuItem = await Menu.findOne({ 
                _id: menuItemId, 
                restaurant: restaurantId 
            });

            if (!menuItem) {
                const error = new Error(`Menu item ${menuItemId} not found in this restaurant`);
                error.statusCode = 404;
                throw error;
            }

            // Créer l'item validé
            const validatedItem = {
                menuItem: menuItemId,
                name: menuItem.name,
                unitPrice: menuItem.price,
                quantity: parseInt(quantity),
                total: parseFloat((menuItem.price * quantity).toFixed(2)),
                notes: notes || ''
            };

            validatedItems.push(validatedItem);
        }

        return validatedItems;
    }

    /**
     * Attribue automatiquement un partenaire de livraison disponible
     * @param {String} orderId - ID de la commande
     * @returns {Object} Partenaire de livraison assigné
     */
    async assignDeliveryPartner(orderId) {
        try {
            // Récupérer les partenaires de livraison disponibles
            const availablePartners = await this.getAvailableDeliveryPartners();
            
            if (availablePartners.length === 0) {
                throw new Error('No delivery partners available at the moment');
            }

            // Sélectionner le partenaire avec le moins de commandes actives
            const partnerWithLeastOrders = await this.selectBestDeliveryPartner(availablePartners);
            
            if (!partnerWithLeastOrders) {
                throw new Error('No suitable delivery partner found');
            }

            // --- Début de la logique déplacée ---
            // On populate l'utilisateur et le restaurant pour les notifications futures
            const order = await Order.findById(orderId).populate('restaurant', 'name').populate('user', 'name');

            if (!order) {
                throw new Error('Commande introuvable (depuis le service)');
            }

            order.deliveryPartner = partnerWithLeastOrders._id;
            
            await order.save();

            const updatedOrder = order;

            // Notification du client que le livreur a été assigné (utilise le service temps réel)
            if (updatedOrder.user && updatedOrder.restaurant && partnerWithLeastOrders.user) {
                // Le service de notification doit être appelé avec le modèle complet de la commande pour pouvoir extraire les noms/IDs
                notificationService.sendDeliveryAssignment(
                    updatedOrder.user._id,
                    updatedOrder, 
                    partnerWithLeastOrders
                );
            }

            return updatedOrder;
        } catch (error) {
            console.error('Error assigning delivery partner:', error.message);
            throw error;
        }
    }

    /**
     * Récupère les partenaires de livraison disponibles
     * @returns {Array} Liste des partenaires disponibles
     */
    async getAvailableDeliveryPartners() {
        // Pour l'instant, on récupère tous les partenaires
        // Dans une version plus avancée, on pourrait vérifier leur statut via Redis
        const partners = await DeliveryPartner.find()
            .populate('user', 'name email phone');

        return partners;
    }

    /**
     * Sélectionne le meilleur partenaire de livraison
     * @param {Array} partners - Liste des partenaires disponibles
     * @returns {Object} Meilleur partenaire
     */
    async selectBestDeliveryPartner(partners) {
        let bestPartner = null;
        let minActiveOrders = Infinity;

        for (const partner of partners) {
            // Compter les commandes actives du partenaire
            const activeOrdersCount = await Order.countDocuments({
                deliveryPartner: partner._id,
                status: { $in: ['En livraison', 'Préparée'] }
            });

            if (activeOrdersCount < minActiveOrders) {
                minActiveOrders = activeOrdersCount;
                bestPartner = partner;
            }
        }

        return bestPartner;
    }

    /**
     * Calcule les statistiques de commandes pour un restaurant
     * @param {String} restaurantId - ID du restaurant
     * @param {String} period - Période (day, week, month)
     * @returns {Object} Statistiques
     */
    async getRestaurantOrderStats(restaurantId, period = 'day') {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        const stats = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurantId,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);

        return {
            period,
            startDate,
            endDate: now,
            stats
        };
    }

    /**
     * Récupère les commandes en attente d'attribution
     * @returns {Array} Commandes en attente
     */
    async getPendingOrders() {
        return await Order.find({
            status: 'Préparée',
            deliveryPartner: { $exists: false }
        })
        .populate('restaurant', 'name address')
        .populate('user', 'name phone')
        .populate('items.menuItem', 'name')
        .sort({ createdAt: 1 });
    }

    /**
     * Met à jour le statut d'une commande avec validation
     * @param {String} orderId - ID de la commande
     * @param {String} newStatus - Nouveau statut
     * @param {String} userId - ID de l'utilisateur qui fait la mise à jour
     * @returns {Object} Commande mise à jour
     */
    async updateOrderStatus(orderId, newStatus, userId) {
        // On populate l'utilisateur et le restaurant pour les notifications
        const order = await Order.findById(orderId).populate('user').populate('restaurant', 'name');
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        // --- NOUVEAU : Récupérer l'ancien statut avant la mise à jour
        const oldStatus = order.status; 

        // Validation des transitions de statut
        const validTransitions = {
            'En attente': ['Confirmée', 'Annulée'],
            'Confirmée': ['Préparée', 'Annulée'],
            'Préparée': ['En livraison', 'Annulée'],
            'En livraison': ['Livrée'],
            'Livrée': [], // État final
            'Annulée': [] // État final
        };

        // Si le statut ne change pas, on ne fait rien
        if (oldStatus === newStatus) {
            return order;
        }

        if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(newStatus)) {
            throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
        }

        // Mise à jour et sauvegarde
        order.status = newStatus;
        await order.save();

        // ---------------------------------------------
        // --- LOGIQUE DE NOTIFICATION MISE À JOUR ---
        // ---------------------------------------------
        
        const customerId = order.user._id;

        // Appel du service de notification Socket.IO
        // On passe l'order complet pour que le service puisse extraire le nom du restaurant et autres infos.
        notificationService.sendStatusUpdate(
            customerId, 
            order, // L'objet Order mis à jour et populate
            oldStatus, 
            newStatus
        );
        // ---------------------------------------------
        // --- FIN LOGIQUE DE NOTIFICATION ---
        // ---------------------------------------------

        return order;
    }

    /**
     * Calcule le temps de livraison estimé
     * @param {String} orderId - ID de la commande
     * @returns {Object} Estimation du temps de livraison
     */
    async getEstimatedDeliveryTime(orderId) {
        const order = await Order.findById(orderId)
            .populate('restaurant', 'address')
            .populate('deliveryPartner', 'user');

        if (!order) {
            throw new Error('Order not found');
        }

        // Estimation basique (à améliorer avec des données réelles)
        const basePreparationTime = 20; // minutes
        const baseDeliveryTime = 30; // minutes
        
        let estimatedTime = basePreparationTime + baseDeliveryTime;

        // Ajuster selon le statut
        if (order.status === 'Préparée') {
            estimatedTime = baseDeliveryTime;
        } else if (order.status === 'En livraison') {
            estimatedTime = Math.max(5, baseDeliveryTime / 2);
        } else if (order.status === 'Livrée') {
            estimatedTime = 0;
        }

        return {
            orderId,
            estimatedMinutes: estimatedTime,
            status: order.status,
            createdAt: order.createdAt
        };
    }
}

export const orderService = new OrderService();
