import request from 'supertest';
import app from '../app.js';
import { Restaurant } from '../models/restaurant.model.js';
import { User } from '../models/user.model.js';
import { 
    createTestUser, 
    createTestRestaurantAdmin,
    createTestAdmin,
    authenticatedRequest 
} from './helpers.js';

describe('Restaurant Controller', () => {
    describe('POST /foufoufood/restaurants', () => {
        it('devrait créer un restaurant pour un restaurant_admin', async () => {
            const { token } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Pizza Palace',
                    address: '123 Main St, Montreal, QC',
                }
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Pizza Palace');
            expect(response.body.data.address).toBe('123 Main St, Montreal, QC');
        });

        it('devrait refuser la création sans nom', async () => {
            const { token } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    address: '123 Main St',
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });

        it('devrait refuser la création sans adresse', async () => {
            const { token } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Restaurant Test',
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });

        it('devrait refuser la création pour un non-restaurant_admin', async () => {
            const { token } = await createTestUser();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Test Restaurant',
                    address: '123 Main St',
                }
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser la création sans authentification', async () => {
            const response = await request(app)
                .post('/foufoufood/restaurants')
                .send({
                    name: 'Test Restaurant',
                    address: '123 Main St',
                });

            expect(response.status).toBe(401);
        });

        it('devrait lier le restaurant créé à l\'utilisateur', async () => {
            const { user, token } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Linked Restaurant',
                    address: '123 Main St',
                }
            );

            expect(response.status).toBe(201);
            
            // Vérifier que le restaurant est lié à l'utilisateur
            const updatedUser = await User.findById(user._id);
            const restaurantIds = updatedUser.restaurants.map(r => r.toString());
            expect(restaurantIds).toContain(response.body.data.id);
            
            // Vérifier que le restaurant a l'adminUser
            const restaurant = await Restaurant.findById(response.body.data.id);
            expect(restaurant.adminUser.toString()).toBe(user._id.toString());
        });

        it('devrait permettre à un restaurant_admin de créer plusieurs restaurants', async () => {
            const { user, token } = await createTestRestaurantAdmin();

            // Créer le premier restaurant
            const response1 = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'First Restaurant',
                    address: '123 First Street',
                }
            );

            expect(response1.status).toBe(201);
            const restaurant1Id = response1.body.data.id;

            // Créer le deuxième restaurant
            const response2 = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Second Restaurant',
                    address: '456 Second Street',
                }
            );

            expect(response2.status).toBe(201);
            const restaurant2Id = response2.body.data.id;

            // Créer le troisième restaurant
            const response3 = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Third Restaurant',
                    address: '789 Third Street',
                }
            );

            expect(response3.status).toBe(201);
            const restaurant3Id = response3.body.data.id;

            // Vérifier que tous les restaurants appartiennent à l'utilisateur
            const updatedUser = await User.findById(user._id);
            const restaurantIds = updatedUser.restaurants.map(r => r.toString());
            
            expect(restaurantIds).toContain(restaurant1Id);
            expect(restaurantIds).toContain(restaurant2Id);
            expect(restaurantIds).toContain(restaurant3Id);
            expect(restaurantIds.length).toBe(3);

            // Vérifier que chaque restaurant a le bon adminUser
            const restaurant1 = await Restaurant.findById(restaurant1Id);
            const restaurant2 = await Restaurant.findById(restaurant2Id);
            const restaurant3 = await Restaurant.findById(restaurant3Id);

            expect(restaurant1.adminUser.toString()).toBe(user._id.toString());
            expect(restaurant2.adminUser.toString()).toBe(user._id.toString());
            expect(restaurant3.adminUser.toString()).toBe(user._id.toString());

            // Vérifier que getMyRestaurants retourne tous les restaurants
            const myRestaurantsResponse = await authenticatedRequest(
                'get',
                '/foufoufood/restaurants/me',
                token
            );

            expect(myRestaurantsResponse.status).toBe(200);
            expect(myRestaurantsResponse.body.data.length).toBe(3);
            
            const myRestaurantIds = myRestaurantsResponse.body.data.map(r => r.id);
            expect(myRestaurantIds).toContain(restaurant1Id);
            expect(myRestaurantIds).toContain(restaurant2Id);
            expect(myRestaurantIds).toContain(restaurant3Id);
        });
    });

    describe('GET /foufoufood/restaurants', () => {
        it('devrait retourner tous les restaurants (public)', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Restaurant 1',
                    address: 'Address 1',
                }
            );

            const response = await request(app)
                .get('/foufoufood/restaurants');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('devrait retourner une liste vide si aucun restaurant', async () => {
            const response = await request(app)
                .get('/foufoufood/restaurants');

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /foufoufood/restaurants/search', () => {
        it('devrait rechercher des restaurants par nom', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Pizza Place',
                    address: '123 Street',
                }
            );

            const response = await request(app)
                .get('/foufoufood/restaurants/search?q=Pizza');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.some(r => r.name.includes('Pizza'))).toBe(true);
        });

        it('devrait rechercher des restaurants par adresse', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Burger Joint',
                    address: '456 Montreal Avenue',
                }
            );

            const response = await request(app)
                .get('/foufoufood/restaurants/search?q=Montreal');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.some(r => r.address.includes('Montreal'))).toBe(true);
        });

        it('devrait rechercher des restaurants par cuisine', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            // Créer un restaurant et le mettre à jour avec une cuisine
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Italian Restaurant',
                    address: '789 Street',
                }
            );

            await authenticatedRequest(
                'put',
                `/foufoufood/restaurants/${createResponse.body.data.id}`,
                token,
                {
                    cuisine: 'Italian',
                }
            );

            const response = await request(app)
                .get('/foufoufood/restaurants/search?q=Italian');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.some(r => r.cuisine && r.cuisine.includes('Italian'))).toBe(true);
        });

        it('devrait refuser la recherche sans query', async () => {
            const response = await request(app)
                .get('/foufoufood/restaurants/search');

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('required');
        });

        it('devrait refuser la recherche avec une query vide', async () => {
            const response = await request(app)
                .get('/foufoufood/restaurants/search?q=');

            expect(response.status).toBe(400);
        });
    });

    describe('GET /foufoufood/restaurants/me', () => {
        it('devrait retourner les restaurants de l\'utilisateur connecté', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'My Restaurant',
                    address: 'My Address',
                }
            );

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/restaurants/me',
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('devrait retourner une liste vide si l\'utilisateur n\'a pas de restaurants', async () => {
            const { token } = await createTestRestaurantAdmin();

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/restaurants/me',
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(0);
        });

        it('devrait refuser l\'accès pour un non-restaurant_admin', async () => {
            const { token } = await createTestUser();

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/restaurants/me',
                token
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            const response = await request(app)
                .get('/foufoufood/restaurants/me');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /foufoufood/restaurants/:id', () => {
        it('devrait retourner un restaurant par son ID', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await request(app)
                .get(`/foufoufood/restaurants/${restaurantId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Test Restaurant');
        });

        it('devrait retourner 404 pour un restaurant inexistant', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .get(`/foufoufood/restaurants/${fakeId}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /foufoufood/restaurants/:id', () => {
        it('devrait mettre à jour un restaurant pour son propriétaire', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Original Name',
                    address: 'Original Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/restaurants/${restaurantId}`,
                token,
                {
                    name: 'Updated Name',
                    cuisine: 'Italian',
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.cuisine).toBe('Italian');
        });

        it('devrait refuser la mise à jour par un non-propriétaire', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: otherToken } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Owner Restaurant',
                    address: 'Owner Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/restaurants/${restaurantId}`,
                otherToken,
                {
                    name: 'Hacked Name',
                }
            );

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not authorized');
        });

        it('devrait refuser la mise à jour sans authentification', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await request(app)
                .put(`/foufoufood/restaurants/${restaurantId}`)
                .send({ name: 'Updated' });

            expect(response.status).toBe(401);
        });

        it('devrait retourner 404 pour un restaurant inexistant lors de la mise à jour', async () => {
            const { token } = await createTestRestaurantAdmin();
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/restaurants/${fakeId}`,
                token,
                {
                    name: 'Updated',
                }
            );

            expect(response.status).toBe(404);
        });

        it('ne devrait pas permettre de modifier adminUser', async () => {
            const { token } = await createTestRestaurantAdmin();
            const { user: otherAdmin } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'put',
                `/foufoufood/restaurants/${restaurantId}`,
                token,
                {
                    adminUser: otherAdmin._id,
                }
            );

            expect(response.status).toBe(200);
            // Vérifier que adminUser n'a pas changé
            const restaurant = await Restaurant.findById(restaurantId);
            expect(restaurant.adminUser.toString()).not.toBe(otherAdmin._id.toString());
        });
    });

    describe('DELETE /foufoufood/restaurants/:id', () => {
        it('devrait supprimer un restaurant pour son propriétaire', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'To Delete',
                    address: 'Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}`,
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedRestaurant = await Restaurant.findById(restaurantId);
            expect(deletedRestaurant).toBeNull();
        });

        it('devrait permettre à un admin plateforme de supprimer n\'importe quel restaurant', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: adminToken } = await createTestAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Admin Can Delete',
                    address: 'Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}`,
                adminToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedRestaurant = await Restaurant.findById(restaurantId);
            expect(deletedRestaurant).toBeNull();
        });

        it('devrait refuser la suppression par un restaurant_admin non-propriétaire', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: otherToken } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Owner Restaurant',
                    address: 'Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}`,
                otherToken
            );

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('not authorized');
        });

        it('devrait retourner 404 pour un restaurant inexistant lors de la suppression', async () => {
            const { token } = await createTestRestaurantAdmin();
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${fakeId}`,
                token
            );

            expect(response.status).toBe(404);
        });

        it('devrait supprimer les menus associés lors de la suppression du restaurant', async () => {
            const { Menu } = await import('../models/menu.model.js');
            const { token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Restaurant with Menu',
                    address: 'Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Créer des menus pour ce restaurant
            await Menu.create({
                name: 'Menu Item 1',
                description: 'Description',
                price: 10.99,
                restaurant: restaurantId,
            });

            await Menu.create({
                name: 'Menu Item 2',
                description: 'Description',
                price: 15.99,
                restaurant: restaurantId,
            });

            // Vérifier que les menus existent
            const menusBefore = await Menu.find({ restaurant: restaurantId });
            expect(menusBefore.length).toBe(2);

            // Supprimer le restaurant
            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}`,
                token
            );

            expect(response.status).toBe(200);

            // Vérifier que les menus ont été supprimés
            const menusAfter = await Menu.find({ restaurant: restaurantId });
            expect(menusAfter.length).toBe(0);
        });

        it('devrait retirer le restaurant de la liste de l\'utilisateur lors de la suppression', async () => {
            const { user, token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Restaurant to Delete',
                    address: 'Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Vérifier que le restaurant est dans la liste de l'utilisateur
            const userBefore = await User.findById(user._id);
            const restaurantIdsBefore = userBefore.restaurants.map(r => r.toString());
            expect(restaurantIdsBefore).toContain(restaurantId);

            // Supprimer le restaurant
            await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}`,
                token
            );

            // Vérifier que le restaurant a été retiré de la liste
            const userAfter = await User.findById(user._id);
            const restaurantIdsAfter = userAfter.restaurants.map(r => r.toString());
            expect(restaurantIdsAfter).not.toContain(restaurantId);
        });

        it('devrait refuser la suppression sans authentification', async () => {
            const { token } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                token,
                {
                    name: 'Test Restaurant',
                    address: 'Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await request(app)
                .delete(`/foufoufood/restaurants/${restaurantId}`);

            expect(response.status).toBe(401);
        });
    });

    describe('POST /foufoufood/restaurants/:id/reviews', () => {
        it('devrait permettre à un client d\'ajouter un avis avec note et commentaire', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken, user: clientUser } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 4,
                    comment: 'Excellent restaurant, je recommande !',
                }
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.rating).toBe(4);
            expect(response.body.data.reviews.length).toBe(1);
            expect(response.body.data.reviews[0].rating).toBe(4);
            expect(response.body.data.reviews[0].comment).toBe('Excellent restaurant, je recommande !');
            expect(response.body.data.reviews[0].user.id || response.body.data.reviews[0].user._id).toBe(clientUser.id);
        });

        it('devrait permettre à un client d\'ajouter un avis avec seulement une note', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 5,
                }
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.rating).toBe(5);
            expect(response.body.data.reviews.length).toBe(1);
            expect(response.body.data.reviews[0].rating).toBe(5);
        });

        it('devrait mettre à jour la review existante d\'un client', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Première review
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 3,
                    comment: 'Pas mal',
                }
            );

            // Mise à jour de la review
            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 5,
                    comment: 'Excellent maintenant !',
                }
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('updated');
            expect(response.body.data.reviews.length).toBe(1); // Toujours une seule review
            expect(response.body.data.reviews[0].rating).toBe(5);
            expect(response.body.data.reviews[0].comment).toBe('Excellent maintenant !');
            expect(response.body.data.rating).toBe(5);
        });

        it('devrait recalculer la note moyenne du restaurant', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken1 } = await createTestUser({ role: 'client' });
            const { token: clientToken2 } = await createTestUser({ role: 'client' });
            const { token: clientToken3 } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Première review : 5 étoiles
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken1,
                {
                    rating: 5,
                }
            );

            // Deuxième review : 4 étoiles
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken2,
                {
                    rating: 4,
                }
            );

            // Troisième review : 3 étoiles
            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken3,
                {
                    rating: 3,
                }
            );

            expect(response.status).toBe(201);
            // Note moyenne : (5 + 4 + 3) / 3 = 4.0
            expect(response.body.data.rating).toBe(4.0);
            expect(response.body.data.reviews.length).toBe(3);
        });

        it('devrait refuser l\'ajout d\'avis par un non-client', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: adminToken } = await createTestAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                adminToken,
                {
                    rating: 5,
                }
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser l\'ajout d\'avis sans authentification', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await request(app)
                .post(`/foufoufood/restaurants/${restaurantId}/reviews`)
                .send({
                    rating: 5,
                });

            expect(response.status).toBe(401);
        });

        it('devrait refuser l\'ajout d\'avis sans note', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    comment: 'Super restaurant',
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Rating');
        });

        it('devrait refuser l\'ajout d\'avis avec une note invalide (trop basse)', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 0,
                }
            );

            expect(response.status).toBe(400);
        });

        it('devrait refuser l\'ajout d\'avis avec une note invalide (trop haute)', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 6,
                }
            );

            expect(response.status).toBe(400);
        });

        it('devrait refuser l\'ajout d\'avis pour un restaurant inexistant', async () => {
            const { token: clientToken } = await createTestUser({ role: 'client' });
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${fakeId}/reviews`,
                clientToken,
                {
                    rating: 5,
                }
            );

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /foufoufood/restaurants/:id/reviews', () => {
        it('devrait permettre à un client de supprimer son propre avis', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Ajouter une review
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 4,
                    comment: 'Bon restaurant',
                }
            );

            // Supprimer la review
            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reviews.length).toBe(0);
            expect(response.body.data.rating).toBe(0);
        });

        it('devrait recalculer la note moyenne après suppression d\'un avis', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken1 } = await createTestUser({ role: 'client' });
            const { token: clientToken2 } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Deux reviews : 5 et 4
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken1,
                {
                    rating: 5,
                }
            );

            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken2,
                {
                    rating: 4,
                }
            );

            // Supprimer la review de 4 étoiles
            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken2
            );

            expect(response.status).toBe(200);
            expect(response.body.data.reviews.length).toBe(1);
            expect(response.body.data.rating).toBe(5);
        });

        it('devrait refuser la suppression d\'avis par un non-client', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            const { token: adminToken } = await createTestAdmin();
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Ajouter une review
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 4,
                }
            );

            // Tentative de suppression par un admin
            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                adminToken
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser la suppression d\'avis sans authentification', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            // Ajouter une review
            await authenticatedRequest(
                'post',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken,
                {
                    rating: 4,
                }
            );

            const response = await request(app)
                .delete(`/foufoufood/restaurants/${restaurantId}/reviews`);

            expect(response.status).toBe(401);
        });

        it('devrait refuser la suppression d\'avis inexistant', async () => {
            const { token: ownerToken } = await createTestRestaurantAdmin();
            const { token: clientToken } = await createTestUser({ role: 'client' });
            
            const createResponse = await authenticatedRequest(
                'post',
                '/foufoufood/restaurants',
                ownerToken,
                {
                    name: 'Test Restaurant',
                    address: 'Test Address',
                }
            );

            const restaurantId = createResponse.body.data.id;

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${restaurantId}/reviews`,
                clientToken
            );

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('not found');
        });

        it('devrait refuser la suppression d\'avis pour un restaurant inexistant', async () => {
            const { token: clientToken } = await createTestUser({ role: 'client' });
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/restaurants/${fakeId}/reviews`,
                clientToken
            );

            expect(response.status).toBe(404);
        });
    });
});

