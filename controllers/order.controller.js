import { Order } from '../models/order.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { User } from '../models/user.model.js';
import { DeliveryPartner } from '../models/deliveryPartner.model.js';
import { orderService } from '../services/order.service.js';
import { cartService } from '../services/cart.service.js';
import { emailService } from '../services/email.service.js';
import { notificationService } from '../services/notification.service.js';

/**
 * Crée une nouvelle commande depuis le panier ou avec des items manuels
 * @param {Object} req - Objet de requête Express contenant deliveryAddress et useCart dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la commande créée
 */
export const createOrder = async (req, res, next) => {
    try {
        const { deliveryAddress, useCart = true } = req.body;

        let validatedItems, restaurantId;

        if (useCart) {
            const validatedCart = await cartService.validateCart(req.user.id);
            validatedItems = validatedCart.items;
            restaurantId = validatedCart.restaurantId;
        } else {
            const { restaurantId: manualRestaurantId, items } = req.body;
            
            if (!manualRestaurantId || !items || !deliveryAddress) {
                return res.status(400).json({ 
                    message: 'Restaurant ID, items, and delivery address are required' 
                });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ 
                    message: 'Items array is required and must not be empty' 
                });
            }

            restaurantId = manualRestaurantId;
            
            const restaurantCheck = await Restaurant.findById(restaurantId);
            if (!restaurantCheck) {
                return res.status(404).json({ message: 'Restaurant not found' });
            }

            validatedItems = await orderService.validateAndEnrichOrderItems(items, restaurantId);
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const totalPrice = validatedItems.reduce((sum, item) => sum + item.total, 0);

        const orderData = {
            user: req.user.id,
            restaurant: restaurantId,
            items: validatedItems,
            totalPrice,
            deliveryAddress,
            status: 'En attente'
        };

        const order = await Order.create(orderData);

        await User.findByIdAndUpdate(req.user.id, {
            $push: { orders: order._id }
        });

        if (useCart) {
            await cartService.clearCart(req.user.id);
        }

        try {
           /* await orderService.assignDeliveryPartner(order._id); */
        } catch (assignmentError) {
            console.log('Aucun partenaire de livraison disponible pour le moment:', assignmentError.message);
        }

        const populatedOrder = await Order.findById(order._id)
            .populate('restaurant', 'name address cuisine')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image');

        try {
            await emailService.sendOrderConfirmation(populatedOrder, req.user);
            await notificationService.sendOrderConfirmation(req.user.id, populatedOrder);
        } catch (notificationError) {
            console.error('Erreur envoi notifications confirmation:', notificationError.message);
        }

        res.status(201).json({ 
            success: true, 
            data: populatedOrder,
            message: 'Order created successfully' 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère toutes les commandes de l'utilisateur authentifié avec pagination
 * @param {Object} req - Objet de requête Express contenant status, limit, page dans req.query
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les commandes et la pagination
 */
export const getMyOrders = async (req, res, next) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;
        
        const filter = { user: req.user.id };
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        
        const orders = await Order.find(filter)
            .populate('restaurant', 'name address cuisine')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Order.countDocuments(filter);

        res.status(200).json({ 
            success: true, 
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère une commande spécifique par son ID avec vérification des permissions
 * @param {Object} req - Objet de requête Express contenant l'ID de la commande dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la commande trouvée
 */
export const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name address cuisine phone')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let canView = false;


        if (order.user && (order.user._id?.toString() === req.user.id || order.user.toString() === req.user.id)) {
            canView = true;
        }

        else if (req.user.role === 'delivery_partner' && order.deliveryPartner) {
            const deliveryPartner = await DeliveryPartner.findById(order.deliveryPartner).populate('user');
            if (deliveryPartner && deliveryPartner.user?._id?.toString() === req.user.id) {
                canView = true;
            }
        }

        else if (req.user.role === 'platform_admin') {
            canView = true;
        }

        else if (req.user.role === 'restaurant_admin') {
            const user = await User.findById(req.user.id);
            const restaurantIdStr = order.restaurant?._id?.toString() || order.restaurant?.toString();
            if (user && user.restaurants.some(restId => restId.toString() === restaurantIdStr)) {
                canView = true;
            }
        }

        if (!canView) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

/**
 * Met à jour le statut d'une commande avec vérification des permissions selon le rôle
 * @param {Object} req - Objet de requête Express contenant l'ID de la commande dans req.params.id et le nouveau statut dans req.body
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la commande mise à jour
 */
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const validStatuses = ['En attente', 'Confirmée', 'Préparée', 'En livraison', 'Livrée', 'Annulée'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let canUpdate = false;
        
        if (req.user.role === 'platform_admin') {
            canUpdate = true;
        } else if (req.user.role === 'restaurant_admin') {
            const user = await User.findById(req.user.id);
            canUpdate = user.restaurants.includes(order.restaurant);
        } else if (req.user.role === 'delivery_partner') {
            const deliveryPartnerRecord = await DeliveryPartner.findOne({ user: req.user.id });

            canUpdate = deliveryPartnerRecord &&
                    order.deliveryPartner &&
                    order.deliveryPartner.toString() === deliveryPartnerRecord._id.toString() &&
                    (status === 'En livraison' || status === 'Livrée') &&
                    (order.status === 'Préparée' || order.status === 'En livraison');
        }

        if (!canUpdate) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        const oldStatus = order.status; // <-- SAUVEGARDER L'ANCIEN STATUT
    
        order.status = status;
        await order.save();
        
        const updatedOrder = await Order.findById(id)
            .populate('restaurant', 'name address cuisine')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image');
        
        // --- NOUVELLE LOGIQUE DE NOTIFICATION ---
        try {
            if (updatedOrder.user) {
                console.log(`➡️ [NOTIF_CALL] Tentative d'envoi de mise à jour du statut ${oldStatus} -> ${updatedOrder.status} pour la commande ${updatedOrder._id}`);
                
                await notificationService.sendStatusUpdate(
                    updatedOrder.user._id.toString(), // ID de l'utilisateur client
                    updatedOrder, 
                    oldStatus, 
                    updatedOrder.status
                );

                // Gérer le cas où le statut passe à 'Livrée' (si vous avez une fonction dédiée)
                if (updatedOrder.status === 'Livrée') {
                    await notificationService.sendDeliveryNotification(updatedOrder.user._id.toString(), updatedOrder);
                }
            }
        } catch (notificationError) {
            console.error('❌ Erreur envoi notification statut:', notificationError.message);
        }

        res.status(200).json({ 
            success: true, 
            data: updatedOrder,
            message: 'Order status updated successfully' 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Annule une commande - peut être annulée par le client, l'admin restaurant ou l'admin plateforme
 * @param {Object} req - Objet de requête Express contenant l'ID de la commande dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la commande annulée
 */
export const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name address cuisine')
            .populate('user', 'name email phone');
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Vérifier les permissions
        let canCancel = false;
        
        // Le client peut annuler sa propre commande
        if (req.user.role === 'client' && order.user._id.toString() === req.user.id) {
            canCancel = true;
        }
        // L'admin restaurant peut annuler les commandes de ses restaurants
        else if (req.user.role === 'restaurant_admin') {
            const user = await User.findById(req.user.id);
            const restaurantIdStr = order.restaurant._id?.toString() || order.restaurant.toString();
            if (user && user.restaurants.some(restId => restId.toString() === restaurantIdStr)) {
                canCancel = true;
            }
        }
        // L'admin plateforme peut annuler n'importe quelle commande
        else if (req.user.role === 'platform_admin') {
            canCancel = true;
        }

        if (!canCancel) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        // Ne peut pas annuler une commande déjà livrée ou déjà annulée
        if (order.status === 'Livrée') {
            return res.status(400).json({ 
                message: 'Cannot cancel an order that is already delivered' 
            });
        }

        if (order.status === 'Annulée') {
            return res.status(400).json({ 
                message: 'This order is already cancelled' 
            });
        }

        const oldStatus = order.status;
        order.status = 'Annulée';
        await order.save();

        // Populate l'order complet pour la notification
        const populatedOrder = await Order.findById(order._id)
            .populate('restaurant', 'name address cuisine')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image');

        // Envoyer une notification au client
        try {
            if (populatedOrder.user) {
                const userId = populatedOrder.user._id.toString();
                await notificationService.sendStatusUpdate(
                    userId,
                    populatedOrder,
                    oldStatus,
                    'Annulée'
                );
                console.log(`📧 Notification d'annulation envoyée à l'utilisateur ${userId}`);
            }
        } catch (notificationError) {
            console.error('❌ Erreur envoi notification annulation:', notificationError.message);
        }

        res.status(200).json({ 
            success: true, 
            data: populatedOrder,
            message: 'Order cancelled successfully' 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère les commandes disponibles pour attribution aux livreurs
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les commandes disponibles
 */
export const getAvailableOrders = async (req, res, next) => {
    try {
        // Les livreurs peuvent voir les commandes "En attente" (pour les prendre) 
        // et "Préparée" (prêtes à être livrées)
        const availableOrders = await Order.find({ 
            status: { $in: ['En attente', 'Préparée'] },
            deliveryPartner: { $exists: false }
        })
        .populate('restaurant', 'name address')
        .populate('user', 'name phone')
        .populate('items.menuItem', 'name')
        .sort({ createdAt: 1 });

        res.status(200).json({ 
            success: true, 
            data: availableOrders 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assigne une commande au livreur authentifié
 * @param {Object} req - Objet de requête Express contenant l'ID de la commande dans req.params.id
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec la commande assignée
 */
export const assignOrderToMe = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        const deliveryPartner = await DeliveryPartner.findOne({ user: req.user.id });
        if (!deliveryPartner) {
            return res.status(403).json({ message: 'User is not a delivery partner' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            const error = new Error('Order not found');
            error.statusCode = 404;
            throw error;
        }

        // Permettre aux livreurs de prendre les commandes "En attente" ou "Préparée"
        if (order.status !== 'En attente' && order.status !== 'Préparée') {
             return res.status(400).json({ message: 'Order must be in "En attente" or "Préparée" status to be assigned' });
        }
        if (order.deliveryPartner) {
             return res.status(400).json({ message: 'Order is already assigned' });
        }

        const oldStatus = order.status; // Sauvegarder l'ancien statut
        order.deliveryPartner = deliveryPartner._id;
        // Si la commande est "En attente", la passer à "Confirmée" quand un livreur la prend
        if (order.status === 'En attente') {
            order.status = 'Confirmée';
        }
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('restaurant', 'name address cuisine phone')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image');

        // --- NOUVELLE LOGIQUE DE NOTIFICATION ---
        try {
            if (populatedOrder.user) {
                const userId = populatedOrder.user._id.toString();
                
                // Envoyer une notification de changement de statut si le statut a changé
                if (oldStatus !== populatedOrder.status) {
                    console.log(`➡️ [NOTIF_CALL] Envoi notification changement de statut ${oldStatus} -> ${populatedOrder.status}`);
                    await notificationService.sendStatusUpdate(
                        userId,
                        populatedOrder,
                        oldStatus,
                        populatedOrder.status
                    );
                }
                
                // Envoyer une notification d'attribution de livreur
                if (deliveryPartner) {
                    console.log(`➡️ [NOTIF_CALL] Tentative d'envoi d'attribution du livreur à la commande ${populatedOrder._id}`);
                    const dpRecordWithUser = await DeliveryPartner.findById(deliveryPartner._id).populate('user');
                    
                    await notificationService.sendDeliveryAssignment(
                        userId, 
                        populatedOrder, 
                        dpRecordWithUser 
                    );
                }
            }
        } catch (notificationError) {
            console.error('❌ Erreur envoi notification attribution:', notificationError.message);
        }

        res.status(200).json({
            success: true,
            data: populatedOrder,
            message: 'Order assigned successfully'
            });
    } catch (error) {
        next(error); 
    }
};

/**
 * Récupère toutes les commandes assignées au livreur authentifié
 * @param {Object} req - Objet de requête Express contenant req.user
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant pour la gestion des erreurs
 * @returns {Promise<void>} envoie une réponse JSON avec les commandes assignées
 */
export const getMyAssignedOrders = async (req, res, next) => {
    try {
        const deliveryPartner = await DeliveryPartner.findOne({ user: req.user.id });
        if (!deliveryPartner) {
            return res.status(404).json({ message: 'Delivery partner profile not found for this user' });
        }

        const assignedOrders = await Order.find({
            deliveryPartner: deliveryPartner._id,
            status: { $in: ['Confirmée', 'Préparée', 'En livraison'] } 
        })
        .populate('restaurant', 'name address phone')
        .populate('user', 'name phone')
        .populate({
            path: 'deliveryPartner',
            populate: { path: 'user', select: 'name email' }
        })
        .populate('items.menuItem', 'name')
        .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: assignedOrders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère les commandes d'un restaurant pour l'admin restaurant
 * @param {Object} req - Objet de requête Express contenant restaurantId dans req.query
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Promise<void>} envoie une réponse JSON avec les commandes du restaurant
 */
export const getRestaurantOrders = async (req, res, next) => {
    try {
        const { restaurantId, status, limit = 50, page = 1 } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID is required' });
        }

        // Vérifier que l'utilisateur est admin du restaurant
        if (req.user.role === 'restaurant_admin') {
            const user = await User.findById(req.user.id);
            const restaurantIdStr = restaurantId.toString();
            if (!user || !user.restaurants.some(restId => restId.toString() === restaurantIdStr)) {
                return res.status(403).json({ message: 'Not authorized to view orders for this restaurant' });
            }
        } else if (req.user.role !== 'platform_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const filter = { restaurant: restaurantId };
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(filter)
            .populate('restaurant', 'name address cuisine')
            .populate('user', 'name email phone')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('items.menuItem', 'name description image')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalOrders: total
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Récupère l'historique des commandes livrées pour le livreur authentifié
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Promise<void>} envoie une réponse JSON avec les commandes livrées
 */
export const getMyDeliveryHistory = async (req, res, next) => {
    try {
        const deliveryPartner = await DeliveryPartner.findOne({ user: req.user.id });
        if (!deliveryPartner) {
            return res.status(404).json({ message: 'Profil livreur non trouvé pour cet utilisateur' });
        }

        const deliveredOrders = await Order.find({
            deliveryPartner: deliveryPartner._id,
            status: 'Livrée'
        })
        .populate('restaurant', 'name address phone')
        .populate('user', 'name phone')
        .populate('items.menuItem', 'name')
        .sort({ createdAt: -1 }); // Tri par date

        res.status(200).json({
            success: true,
            data: deliveredOrders
        });
    } catch (error) {
        next(error);
    }
};