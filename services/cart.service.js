import { Menu } from '../models/menu.model.js';
import redisClient from '../config/redis.js';

class CartService {
    /**
     * Ajoute un item au panier de l'utilisateur
     * @param {String} userId - ID de l'utilisateur
     * @param {String} menuItemId - ID de l'item du menu
     * @param {Number} quantity - Quantité
     * @param {String} notes - Notes spéciales
     * @returns {Object} Panier mis à jour
     */
    async addToCart(userId, menuItemId, quantity = 1, notes = '') {
        try {
            const menuItem = await Menu.findById(menuItemId).populate('restaurant', 'name');
            if (!menuItem) {
                throw new Error('Menu item not found');
            }

            const cartKey = `cart:${userId}`;
            const existingCart = await this.getCart(userId);

            const menuItemIdStr = String(menuItemId);
            const existingItemIndex = existingCart.items.findIndex(
                item => String(item.menuItemId) === menuItemIdStr
            );

            if (existingItemIndex >= 0) {
                existingCart.items[existingItemIndex].quantity += quantity;
                existingCart.items[existingItemIndex].total = 
                    existingCart.items[existingItemIndex].quantity * menuItem.price;
            } else {
                const newItem = {
                    menuItemId: String(menuItemId),
                    name: menuItem.name,
                    unitPrice: menuItem.price,
                    quantity: parseInt(quantity),
                    total: parseFloat((menuItem.price * quantity).toFixed(2)),
                    notes: notes || '',
                    restaurantId: String(menuItem.restaurant._id),
                    restaurantName: menuItem.restaurant.name
                };
                
                existingCart.items.push(newItem);
            }


            if (existingCart.items.length > 0) {
                const existingRestaurantIds = existingCart.items.map(item => String(item.restaurantId));
                const newRestaurantId = String(menuItem.restaurant._id);
                
                const allSameRestaurant = existingRestaurantIds.every(id => id === newRestaurantId);
                if (!allSameRestaurant) {
                    throw new Error('All items in cart must be from the same restaurant');
                }
            }

            if (existingCart.items.length > 0) {
                const restaurantIds = [...new Set(existingCart.items.map(item => String(item.restaurantId)))];
                if (restaurantIds.length === 1) {
                    existingCart.restaurantId = restaurantIds[0];
                    existingCart.restaurantName = existingCart.items[0].restaurantName;
                }
            }

            existingCart.totalPrice = existingCart.items.reduce((sum, item) => sum + item.total, 0);
            existingCart.updatedAt = new Date().toISOString();

            // Sauvegarder dans Redis
            await redisClient.set(cartKey, JSON.stringify(existingCart), { EX: 86400 }); // 24h

            return existingCart;
        } catch (error) {
            throw new Error(`Error adding to cart: ${error.message}`);
        }
    }

    /**
     * Met à jour la quantité d'un item dans le panier
     * @param {String} userId - ID de l'utilisateur
     * @param {String} menuItemId - ID de l'item du menu
     * @param {Number} quantity - Nouvelle quantité
     * @returns {Object} Panier mis à jour
     */
    async updateCartItem(userId, menuItemId, quantity) {
        try {
            const cart = await this.getCart(userId);
            const menuItemIdStr = String(menuItemId);
            const itemIndex = cart.items.findIndex(item => String(item.menuItemId) === menuItemIdStr);

            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = parseInt(quantity);
                cart.items[itemIndex].total = 
                    parseFloat((cart.items[itemIndex].unitPrice * quantity).toFixed(2));
            }

            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
            cart.updatedAt = new Date().toISOString();

            const cartKey = `cart:${userId}`;
            await redisClient.set(cartKey, JSON.stringify(cart), { EX: 86400 });

            return cart;
        } catch (error) {
            throw new Error(`Error updating cart item: ${error.message}`);
        }
    }

    /**
     * Supprime un item du panier
     * @param {String} userId - ID de l'utilisateur
     * @param {String} menuItemId - ID de l'item du menu
     * @returns {Object} Panier mis à jour
     */
    async removeFromCart(userId, menuItemId) {
        try {
            const cart = await this.getCart(userId);

            const menuItemIdStr = String(menuItemId);
            const itemIndex = cart.items.findIndex(item => String(item.menuItemId) === menuItemIdStr);
            
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }
            
            cart.items = cart.items.filter(item => String(item.menuItemId) !== menuItemIdStr);

            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
            cart.updatedAt = new Date().toISOString();

            if (cart.items.length === 0) {
                cart.restaurantId = null;
                cart.restaurantName = null;
            }

            const cartKey = `cart:${userId}`;
            await redisClient.set(cartKey, JSON.stringify(cart), { EX: 86400 });

            return cart;
        } catch (error) {
            throw new Error(`Error removing from cart: ${error.message}`);
        }
    }

    /**
     * Vide complètement le panier
     * @param {String} userId - ID de l'utilisateur
     * @returns {Object} Panier vide
     */
    async clearCart(userId) {
        try {
            const emptyCart = {
                items: [],
                totalPrice: 0,
                restaurantId: null,
                restaurantName: null,
                updatedAt: new Date().toISOString()
            };

            const cartKey = `cart:${userId}`;
            await redisClient.set(cartKey, JSON.stringify(emptyCart), { EX: 86400 });

            return emptyCart;
        } catch (error) {
            throw new Error(`Error clearing cart: ${error.message}`);
        }
    }

    /**
     * Récupère le panier de l'utilisateur
     * @param {String} userId - ID de l'utilisateur
     * @returns {Object} Panier de l'utilisateur
     */
    async getCart(userId) {
        try {
            const cartKey = `cart:${userId}`;
            const cartData = await redisClient.get(cartKey);

            if (!cartData) {
                return {
                    items: [],
                    totalPrice: 0,
                    restaurantId: null,
                    restaurantName: null,
                    updatedAt: new Date().toISOString()
                };
            }

            return JSON.parse(cartData);
        } catch (error) {
            throw new Error(`Error getting cart: ${error.message}`);
        }
    }

    /**
     * Valide le panier avant de passer commande
     * @param {String} userId - ID de l'utilisateur
     * @returns {Object} Panier validé avec les données complètes
     */
    async validateCart(userId) {
        try {
            const cart = await this.getCart(userId);

            if (cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            if (!cart.restaurantId) {
                throw new Error('Cart must contain items from the same restaurant');
            }

            const validatedItems = [];
            for (const item of cart.items) {
                const menuItem = await Menu.findById(item.menuItemId);
                if (!menuItem) {
                    throw new Error(`Menu item ${item.name} is no longer available`);
                }

                if (menuItem.restaurant.toString() !== cart.restaurantId) {
                    throw new Error(`Menu item ${item.name} is not from the correct restaurant`);
                }

                const updatedItem = {
                    menuItem: item.menuItemId, // Mapper menuItemId vers menuItem pour la commande
                    name: item.name,
                    unitPrice: menuItem.price,
                    quantity: item.quantity,
                    total: parseFloat((menuItem.price * item.quantity).toFixed(2)),
                    notes: item.notes || ''
                };

                validatedItems.push(updatedItem);
            }

            const totalPrice = validatedItems.reduce((sum, item) => sum + item.total, 0);

            return {
                ...cart,
                items: validatedItems,
                totalPrice
            };
        } catch (error) {
            throw new Error(`Error validating cart: ${error.message}`);
        }
    }

    /**
     * Récupère les statistiques du panier
     * @param {String} userId - ID de l'utilisateur
     * @returns {Object} Statistiques du panier
     */
    async getCartStats(userId) {
        try {
            const cart = await this.getCart(userId);

            return {
                itemCount: cart.items.length,
                totalPrice: cart.totalPrice,
                restaurantId: cart.restaurantId,
                restaurantName: cart.restaurantName,
                lastUpdated: cart.updatedAt
            };
        } catch (error) {
            throw new Error(`Error getting cart stats: ${error.message}`);
        }
    }
}

export const cartService = new CartService();
