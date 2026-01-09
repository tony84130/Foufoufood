import request from 'supertest';
import app from '../app.js';
import { Menu } from '../models/menu.model.js';
import { Restaurant } from '../models/restaurant.model.js';
import { 
    createTestRestaurantAdmin,
    createTestAdmin,
    authenticatedRequest 
} from './helpers.js';

describe('Menu Controller', () => {
    let restaurantId;
    let ownerToken;
    let menuItemId;

    beforeEach(async () => {
        const owner = await createTestRestaurantAdmin();
        ownerToken = owner.token;

        const createResponse = await authenticatedRequest(
            'post',
            '/foufoufood/restaurants',
            ownerToken,
            {
                name: 'Test Restaurant',
                address: 'Test Address',
            }
        );

        restaurantId = createResponse.body.data.id;
    });

    describe('POST /foufoufood/menus', () => {
        it('devrait ajouter un item au menu d\'un restaurant', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Pizza Margherita',
                    description: 'Délicieuse pizza',
                    price: 15.99,
                    category: 'Plat',
                }
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Pizza Margherita');
            expect(response.body.data.price).toBe(15.99);
            menuItemId = response.body.data.id;
        });

        it('devrait refuser l\'ajout sans restaurantId', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    name: 'Pizza',
                    price: 15.99,
                }
            );

            expect(response.status).toBe(400);
        });

        it('devrait refuser l\'ajout par un non-propriétaire', async () => {
            const { token: otherToken } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                otherToken,
                {
                    restaurantId,
                    name: 'Pizza',
                    price: 15.99,
                }
            );

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not authorized');
        });

        it('devrait refuser l\'ajout sans authentification', async () => {
            const response = await request(app)
                .post('/foufoufood/menus')
                .send({
                    restaurantId,
                    name: 'Pizza',
                    price: 15.99,
                });

            expect(response.status).toBe(401);
        });

        it('devrait refuser l\'ajout pour un restaurant inexistant', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId: fakeId,
                    name: 'Pizza',
                    price: 15.99,
                }
            );

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });

        it('devrait refuser l\'ajout sans nom', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    price: 15.99,
                }
            );

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('devrait refuser l\'ajout sans prix', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Pizza',
                }
            );

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('devrait refuser l\'ajout avec un prix négatif', async () => {
            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Pizza',
                    price: -10.99,
                }
            );

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('devrait refuser l\'ajout par un platform_admin', async () => {
            const { token: adminToken } = await createTestAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                adminToken,
                {
                    restaurantId,
                    name: 'Admin Added Item',
                    price: 12.99,
                }
            );

            expect(response.status).toBe(403);
        });
    });

    describe('GET /foufoufood/menus', () => {
        it('devrait retourner les items de menu d\'un restaurant', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Item 1',
                    price: 10.99,
                }
            );

            await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Item 2',
                    price: 12.99,
                }
            );

            const response = await request(app)
                .get(`/foufoufood/menus?restaurantId=${restaurantId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
        });

        it('devrait refuser la requête sans restaurantId', async () => {
            const response = await request(app)
                .get('/foufoufood/menus');

            expect(response.status).toBe(400);
        });
    });

    describe('GET /foufoufood/menus/search', () => {
        it('devrait rechercher des items de menu par nom', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Pizza Pepperoni',
                    description: 'Pizza avec pepperoni',
                    price: 16.99,
                }
            );

            const response = await request(app)
                .get(`/foufoufood/menus/search?restaurantId=${restaurantId}&q=Pepperoni`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.some(item => item.name.includes('Pepperoni'))).toBe(true);
        });

        it('devrait rechercher des items de menu par description', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    description: 'Délicieux burger avec fromage',
                    price: 14.99,
                }
            );

            const response = await request(app)
                .get(`/foufoufood/menus/search?restaurantId=${restaurantId}&q=Délicieux`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.some(item => item.description && item.description.includes('Délicieux'))).toBe(true);
        });

        it('devrait rechercher des items de menu par catégorie', async () => {
            await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Tiramisu',
                    price: 8.99,
                    category: 'Dessert',
                }
            );

            const response = await request(app)
                .get(`/foufoufood/menus/search?restaurantId=${restaurantId}&q=Dessert`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.some(item => item.category === 'Dessert')).toBe(true);
        });

        it('devrait refuser la recherche sans restaurantId', async () => {
            const response = await request(app)
                .get('/foufoufood/menus/search?q=Pizza');

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Restaurant ID');
        });

        it('devrait refuser la recherche sans query', async () => {
            const response = await request(app)
                .get(`/foufoufood/menus/search?restaurantId=${restaurantId}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Search query');
        });

        it('devrait refuser la recherche avec une query vide', async () => {
            const response = await request(app)
                .get(`/foufoufood/menus/search?restaurantId=${restaurantId}&q=`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /foufoufood/menus/:id', () => {
        it('devrait retourner un item de menu par son ID', async () => {
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Burger',
                    price: 12.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await request(app)
                .get(`/foufoufood/menus/${itemId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Burger');
        });

        it('devrait retourner 404 pour un item de menu inexistant', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .get(`/foufoufood/menus/${fakeId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });
    });

    describe('PUT /foufoufood/menus/:id', () => {
        it('devrait mettre à jour un item de menu', async () => {
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Original Item',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/menus/${itemId}`,
                ownerToken,
                {
                    price: 14.99,
                    description: 'Updated description',
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.price).toBe(14.99);
            expect(response.body.data.description).toBe('Updated description');
        });

        it('devrait refuser la mise à jour par un non-propriétaire', async () => {
            const { token: otherToken } = await createTestRestaurantAdmin();

            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Owner Item',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/menus/${itemId}`,
                otherToken,
                {
                    price: 5.99,
                }
            );

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not authorized');
        });

        it('devrait refuser la mise à jour sans authentification', async () => {
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Test Item',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await request(app)
                .put(`/foufoufood/menus/${itemId}`)
                .send({ price: 15.99 });

            expect(response.status).toBe(401);
        });

        it('devrait retourner 404 pour un item inexistant lors de la mise à jour', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/menus/${fakeId}`,
                ownerToken,
                {
                    price: 15.99,
                }
            );

            expect(response.status).toBe(404);
        });

        it('ne devrait pas permettre de changer le restaurant de l\'item', async () => {
            const { token: otherOwnerToken } = await createTestRestaurantAdmin();
            
            const otherRestaurantResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                otherOwnerToken,
                {
                    name: 'Other Restaurant',
                    address: 'Other Address',
                }
            );
            
            const otherRestaurantId = otherRestaurantResponse.body.data.id;

            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Test Item',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;
            const originalRestaurantId = (await Menu.findById(itemId)).restaurant.toString();

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/menus/${itemId}`,
                ownerToken,
                {
                    restaurant: otherRestaurantId,
                }
            );

            expect(response.status).toBe(200);
            
            // Vérifier que le restaurant n'a pas changé (Mongoose ignore les champs non définis dans le schema ou non modifiables)
            const menuItem = await Menu.findById(itemId);
            const currentRestaurantId = menuItem.restaurant.toString();
            expect(currentRestaurantId).toBe(originalRestaurantId);
            expect(currentRestaurantId).toBe(restaurantId);
            expect(currentRestaurantId).not.toBe(otherRestaurantId);
        });
    });

    describe('DELETE /foufoufood/menus/:id', () => {
        it('devrait supprimer un item de menu', async () => {
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'To Delete',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/menus/${itemId}`,
                ownerToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedItem = await Menu.findById(itemId);
            expect(deletedItem).toBeNull();
        });

        it('devrait refuser la suppression par un non-propriétaire', async () => {
            const { token: otherToken } = await createTestRestaurantAdmin();

            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Owner Item',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/menus/${itemId}`,
                otherToken
            );

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not authorized');

            // Vérifier que l'item n'a pas été supprimé
            const menuItem = await Menu.findById(itemId);
            expect(menuItem).toBeTruthy();
        });

        it('devrait refuser la suppression sans authentification', async () => {
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/menus',
                ownerToken,
                {
                    restaurantId,
                    name: 'Test Item',
                    price: 10.99,
                }
            );

            const itemId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/foufoufood/menus/${itemId}`);

            expect(response.status).toBe(401);
        });

        it('devrait retourner 404 pour un item inexistant lors de la suppression', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/menus/${fakeId}`,
                ownerToken
            );

            expect(response.status).toBe(404);
        });
    });
});

