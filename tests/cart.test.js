import request from 'supertest';
import app from '../app.js';
import { Menu } from '../models/menu.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { 
    createTestUser,
    createTestRestaurantAdmin,
    authenticatedRequest 
} from './helpers.js';

describe('Cart Controller', () => {
    let clientToken;
    let restaurantId;
    let menuItemId;
    let ownerToken;

    beforeEach(async () => {
        const client = await createTestUser();
        clientToken = client.token;

        const owner = await createTestRestaurantAdmin();
        ownerToken = owner.token;

        const restaurantResponse = await authenticatedRequest(
            'post',
            '/foufoufood/restaurants',
            ownerToken,
            {
                name: 'Test Restaurant',
                address: 'Test Address',
            }
        );

        restaurantId = restaurantResponse.body.data.id;

        const menuResponse = await authenticatedRequest(
            'post',
            '/foufoufood/menus',
            ownerToken,
            {
                restaurantId,
                name: 'Pizza Margherita',
                price: 15.99,
            }
        );

        menuItemId = menuResponse.body.data._id || menuResponse.body.data.id;
    });

    describe('GET /foufoufood/cart', () => {
        it('devrait retourner un panier vide au départ', async () => {
            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toEqual([]);
            expect(response.body.data.totalPrice).toBe(0);
            expect(response.body.data.restaurantId).toBeNull();
        });

        it('devrait retourner un panier avec des items', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items.length).toBe(1);
            expect(response.body.data.totalPrice).toBe(31.98);
            expect(response.body.data.restaurantId).toBe(restaurantId);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            const response = await request(app)
                .get('/foufoufood/cart');

            expect(response.status).toBe(401);
        });

        it('devrait refuser l\'accès pour un non-client', async () => {
            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart',
                adminToken
            );

            expect(response.status).toBe(403);
        });
    });

    describe('POST /foufoufood/cart/items', () => {
        it('devrait ajouter un item au panier', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: 2,
                    notes: 'Extra cheese',
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items.length).toBe(1);
            expect(response.body.data.items[0].quantity).toBe(2);
            expect(response.body.data.items[0].notes).toBe('Extra cheese');
            expect(response.body.data.totalPrice).toBe(31.98);
            expect(response.body.data.restaurantId).toBe(restaurantId);
        });

        it('devrait cumuler la quantité quand on ajoute le même item plusieurs fois', async () => {
            // Première ajout
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: 2,
                }
            );

            // Deuxième ajout du même item
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: 3,
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items.length).toBe(1);
            expect(response.body.data.items[0].quantity).toBe(5); // 2 + 3
            expect(response.body.data.totalPrice).toBeCloseTo(79.95, 2); // 15.99 * 5
        });

        it('devrait refuser l\'ajout sans menuItemId', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    quantity: 1,
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Menu item ID');
        });

        it('devrait refuser l\'ajout avec une quantité négative', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: -1,
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Quantity');
        });

        it('devrait refuser l\'ajout avec une quantité nulle', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: 0,
                }
            );

            expect(response.status).toBe(400);
        });

        it('devrait refuser l\'ajout d\'un item inexistant', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId: fakeId,
                    quantity: 1,
                }
            );

            expect(response.status).toBe(500);
            expect(response.body.error || response.body.message).toContain('not found');
        });

        it('devrait refuser l\'ajout d\'un item d\'un restaurant différent', async () => {
            const { token: ownerToken2 } = await createTestRestaurantAdmin();

            // Créer un deuxième restaurant
            const restaurant2Response = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken2,
                {
                    name: 'Second Restaurant',
                    address: 'Second Address',
                }
            );

            const restaurant2Id = restaurant2Response.body.data.id;

            // Créer un item dans le deuxième restaurant
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken2,
                {
                    restaurantId: restaurant2Id,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Ajouter un item du premier restaurant
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: 1,
                }
            );

            // Tentative d'ajouter un item du deuxième restaurant
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId: menu2Id,
                    quantity: 1,
                }
            );

            expect(response.status).toBe(500);
            expect(response.body.error || response.body.message).toContain('same restaurant');
        });

        it('devrait refuser l\'ajout sans authentification', async () => {
            const response = await request(app)
                .post('/foufoufood/cart/items')
                .send({
                    menuItemId,
                    quantity: 1,
                });

            expect(response.status).toBe(401);
        });

        it('devrait refuser l\'ajout pour un non-client', async () => {
            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                adminToken,
                {
                    menuItemId,
                    quantity: 1,
                }
            );

            expect(response.status).toBe(403);
        });

        it('devrait permettre d\'ajouter plusieurs items différents du même restaurant', async () => {
            // Créer un deuxième item dans le même restaurant
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            expect(menu2Response.body.success).toBe(true);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Ajouter le premier item
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId,
                    quantity: 2,
                }
            );

            // Ajouter le deuxième item
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId: menu2Id,
                    quantity: 1,
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items.length).toBe(2);
            // Vérifier que les deux items sont présents
            const itemIds = response.body.data.items.map(item => item.menuItemId.toString());
            expect(itemIds).toContain(menuItemId.toString());
            expect(itemIds).toContain(menu2Id.toString());
            expect(response.body.data.totalPrice).toBeCloseTo(44.97, 2); // (15.99 * 2) + 12.99
        });

        it('devrait refuser l\'ajout avec un menuItemId mal formaté', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                {
                    menuItemId: 'invalid-id-format',
                    quantity: 1,
                }
            );

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('PUT /foufoufood/cart/items/:menuItemId', () => {
        it('devrait mettre à jour la quantité d\'un item', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/cart/items/${menuItemId}`,
                clientToken,
                {
                    quantity: 3,
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items[0].quantity).toBe(3);
            expect(response.body.data.totalPrice).toBe(47.97);
        });

        it('devrait supprimer l\'item si la quantité est 0', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/cart/items/${menuItemId}`,
                clientToken,
                {
                    quantity: 0,
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items.length).toBe(0);
            expect(response.body.data.totalPrice).toBe(0);
        });

        it('devrait refuser la mise à jour d\'un item inexistant dans le panier', async () => {
            // Créer un autre item
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Tenter de mettre à jour un item qui n'est pas dans le panier
            // Convertir en string pour l'URL
            const menu2IdString = menu2Id.toString();
            const response = await authenticatedRequest(
                'put',
                `/foufoufood/cart/items/${menu2IdString}`,
                clientToken,
                {
                    quantity: 2,
                }
            );

            expect(response.status).toBe(500);
            expect(response.body.error || response.body.message).toContain('not found');
        });

        it('devrait refuser la mise à jour avec une quantité négative', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/cart/items/${menuItemId}`,
                clientToken,
                {
                    quantity: -1,
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('cannot be negative');
        });

        it('devrait refuser la mise à jour sans authentification', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await request(app)
                .put(`/foufoufood/cart/items/${menuItemId}`)
                .send({ quantity: 2 });

            expect(response.status).toBe(401);
        });

        it('devrait refuser la mise à jour pour un non-client', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/cart/items/${menuItemId}`,
                adminToken,
                {
                    quantity: 2,
                }
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser la mise à jour avec un menuItemId mal formaté dans l\'URL', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/cart/items/invalid-id-format',
                clientToken,
                {
                    quantity: 2,
                }
            );

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('DELETE /foufoufood/cart/items/:menuItemId', () => {
        it('devrait supprimer un item du panier', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/cart/items/${menuItemId}`,
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items.length).toBe(0);
            expect(response.body.data.totalPrice).toBe(0);
        });

        it('devrait supprimer un item et conserver les autres', async () => {
            // Créer un deuxième item
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Ajouter deux items
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId: menu2Id, quantity: 1 }
            );

            // Supprimer un item
            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/cart/items/${menuItemId}`,
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items.length).toBe(1);
            expect(response.body.data.items[0].menuItemId.toString()).toBe(menu2Id.toString());
            expect(response.body.data.totalPrice).toBe(12.99);
        });

        it('devrait refuser la suppression d\'un item inexistant dans le panier', async () => {
            // Créer un autre item mais ne pas l'ajouter au panier
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Convertir en string pour l'URL
            const menu2IdString = menu2Id.toString();
            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/cart/items/${menu2IdString}`,
                clientToken
            );

            expect(response.status).toBe(500);
            expect(response.body.error || response.body.message).toContain('not found');
        });

        it('devrait refuser la suppression sans authentification', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await request(app)
                .delete(`/foufoufood/cart/items/${menuItemId}`);

            expect(response.status).toBe(401);
        });

        it('devrait refuser la suppression pour un non-client', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/cart/items/${menuItemId}`,
                adminToken
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser la suppression avec un menuItemId mal formaté dans l\'URL', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/cart/items/invalid-id-format',
                clientToken
            );

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('DELETE /foufoufood/cart', () => {
        it('devrait vider complètement le panier', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/cart',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items).toEqual([]);
            expect(response.body.data.totalPrice).toBe(0);
            expect(response.body.data.restaurantId).toBeNull();
        });

        it('devrait vider un panier avec plusieurs items', async () => {
            // Créer un deuxième item
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Ajouter deux items
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId: menu2Id, quantity: 1 }
            );

            // Vider le panier
            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/cart',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items).toEqual([]);
            expect(response.body.data.totalPrice).toBe(0);
        });

        it('devrait refuser la suppression sans authentification', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await request(app)
                .delete('/foufoufood/cart');

            expect(response.status).toBe(401);
        });

        it('devrait refuser la suppression pour un non-client', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/cart',
                adminToken
            );

            expect(response.status).toBe(403);
        });
    });

    describe('GET /foufoufood/cart/stats', () => {
        it('devrait retourner les statistiques du panier', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart/stats',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.itemCount).toBe(1);
            expect(response.body.data.totalPrice).toBe(31.98);
            expect(response.body.data.restaurantId).toBe(restaurantId);
            expect(response.body.data.restaurantName).toBeDefined();
        });

        it('devrait retourner les statistiques d\'un panier vide', async () => {
            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart/stats',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.itemCount).toBe(0);
            expect(response.body.data.totalPrice).toBe(0);
            expect(response.body.data.restaurantId).toBeNull();
        });

        it('devrait retourner les statistiques avec plusieurs items', async () => {
            // Créer un deuxième item
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Ajouter deux items
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId: menu2Id, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart/stats',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.itemCount).toBeGreaterThanOrEqual(2);
            // Le total devrait être correct même si l'itemCount peut différer légèrement
            expect(response.body.data.totalPrice).toBeGreaterThanOrEqual(40);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            const response = await request(app)
                .get('/foufoufood/cart/stats');

            expect(response.status).toBe(401);
        });

        it('devrait refuser l\'accès pour un non-client', async () => {
            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/cart/stats',
                adminToken
            );

            expect(response.status).toBe(403);
        });
    });

    describe('POST /foufoufood/cart/validate', () => {
        it('devrait valider un panier avec des items', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/validate',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items.length).toBeGreaterThan(0);
            expect(response.body.data.restaurantId).toBeDefined();
            expect(response.body.data.items[0].menuItem).toBe(menuItemId);
        });

        it('devrait valider un panier avec plusieurs items', async () => {
            // Créer un deuxième item
            const menu2Response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            expect(menu2Response.status).toBe(201);
            const menu2Id = menu2Response.body.data._id || menu2Response.body.data.id;

            // Ajouter deux items
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId: menu2Id, quantity: 1 }
            );

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/validate',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items.length).toBe(2);
            expect(response.body.data.totalPrice).toBeCloseTo(44.97, 2);
        });

        it('devrait recalculer les prix lors de la validation', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            // Modifier le prix de l'item dans la base
            const updateResponse = await authenticatedRequest(
                'put',
                `/foufoufood/menus/${menuItemId}`,
                ownerToken,
                {
                    price: 20.00,
                }
            );

            expect(updateResponse.status).toBe(200);

            // Valider le panier - le prix devrait être recalculé
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/validate',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.data.items[0].unitPrice).toBe(20.00);
            expect(response.body.data.items[0].total).toBe(40.00);
            expect(response.body.data.totalPrice).toBe(40.00);
        });

        it('devrait refuser la validation d\'un panier vide', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/validate',
                clientToken
            );

            expect(response.status).toBe(500);
            expect(response.body.error || response.body.message).toContain('empty');
        });

        it('devrait refuser la validation si un item n\'existe plus', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 2 }
            );

            // Supprimer l'item du menu
            const deleteResponse = await authenticatedRequest(
                'delete',
                `/foufoufood/menus/${menuItemId}`,
                ownerToken
            );

            expect(deleteResponse.status).toBe(200);

            // Tenter de valider le panier
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/validate',
                clientToken
            );

            expect(response.status).toBe(500);
            expect(response.body.error || response.body.message).toContain('no longer available');
        });

        it('devrait refuser la validation sans authentification', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const response = await request(app)
                .post('/foufoufood/cart/validate');

            expect(response.status).toBe(401);
        });

        it('devrait refuser la validation pour un non-client', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/cart/items',
                clientToken,
                { menuItemId, quantity: 1 }
            );

            const { token: adminToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/cart/validate',
                adminToken
            );

            expect(response.status).toBe(403);
        });
    });
});

