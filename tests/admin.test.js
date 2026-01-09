import request from 'supertest';
import app from '../app.js';
import { Restaurant } from '../models/restaurant.model.js';
import { User } from '../models/user.model.js';
import { 
    createTestAdmin,
    createTestUser,
    authenticatedRequest 
} from './helpers.js';

describe('Admin Controller', () => {
    describe('POST /foufoufood/admin/restaurants', () => {
        it('devrait créer un restaurant avec un nouvel admin', async () => {
            const { token } = await createTestAdmin();

            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street, Montreal',
                adminEmail: `restaurantadmin${Date.now()}@example.com`,
                adminName: 'Restaurant Admin',
                adminPassword: 'password123',
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.restaurant).toBeDefined();
            expect(response.body.data.restaurant.name).toBe(restaurantData.restaurantName);
            expect(response.body.data.admin).toBeDefined();
            expect(response.body.data.admin.role).toBe('restaurant_admin');
            expect(response.body.data.admin.email).toBe(restaurantData.adminEmail.toLowerCase());
            expect(response.body.data.admin.password).toBeUndefined();

            // Vérifier que le restaurant et l'admin sont bien liés
            const restaurant = await Restaurant.findById(response.body.data.restaurant.id);
            expect(restaurant).toBeTruthy();
            expect(restaurant.adminUser.toString()).toBe(response.body.data.admin.id);

            const admin = await User.findById(response.body.data.admin.id);
            expect(admin).toBeTruthy();
            expect(admin.restaurants).toContainEqual(restaurant._id);
        });

        it('devrait associer un admin restaurant existant au nouveau restaurant', async () => {
            const { token } = await createTestAdmin();
            
            // Créer un admin restaurant existant
            const bcrypt = (await import('bcryptjs')).default;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            
            const existingAdmin = await User.create({
                name: 'Existing Admin',
                email: `existingadmin${Date.now()}@example.com`,
                password: hashedPassword,
                role: 'restaurant_admin',
            });

            const restaurantData = {
                restaurantName: 'Second Restaurant',
                restaurantAddress: '456 Second Street, Montreal',
                adminEmail: existingAdmin.email,
                adminName: existingAdmin.name,
                adminPassword: 'password123',
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.admin.id).toBe(existingAdmin.id);

            // Vérifier que le restaurant est ajouté à la liste des restaurants de l'admin
            const updatedAdmin = await User.findById(existingAdmin._id);
            expect(updatedAdmin.restaurants.length).toBeGreaterThan(0);
            const restaurantIds = updatedAdmin.restaurants.map(r => r.toString());
            expect(restaurantIds).toContain(response.body.data.restaurant.id);
        });

        it('devrait refuser si l\'utilisateur existe mais n\'est pas restaurant_admin', async () => {
            const { token } = await createTestAdmin();
            const { user: existingUser } = await createTestUser();

            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street',
                adminEmail: existingUser.email,
                adminName: existingUser.name,
                adminPassword: 'password123',
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not a restaurant admin');

            // Vérifier que le restaurant n'a pas été créé
            const restaurants = await Restaurant.find({ name: restaurantData.restaurantName });
            expect(restaurants.length).toBe(0);
        });

        it('devrait refuser si le nom de l\'admin ne correspond pas', async () => {
            const { token } = await createTestAdmin();
            
            // Créer un admin restaurant existant
            const bcrypt = (await import('bcryptjs')).default;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            
            const existingAdmin = await User.create({
                name: 'Existing Admin',
                email: `admin${Date.now()}@example.com`,
                password: hashedPassword,
                role: 'restaurant_admin',
            });

            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street',
                adminEmail: existingAdmin.email,
                adminName: 'Wrong Name', // Nom incorrect
                adminPassword: 'password123',
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('does not match');

            // Vérifier que le restaurant n'a pas été créé
            const restaurants = await Restaurant.find({ name: restaurantData.restaurantName });
            expect(restaurants.length).toBe(0);
        });

        it('devrait refuser si le mot de passe de l\'admin ne correspond pas', async () => {
            const { token } = await createTestAdmin();
            
            // Créer un admin restaurant existant
            const bcrypt = (await import('bcryptjs')).default;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('correctpassword', salt);
            
            const existingAdmin = await User.create({
                name: 'Existing Admin',
                email: `admin${Date.now()}@example.com`,
                password: hashedPassword,
                role: 'restaurant_admin',
            });

            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street',
                adminEmail: existingAdmin.email,
                adminName: existingAdmin.name,
                adminPassword: 'wrongpassword', // Mot de passe incorrect
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('password');

            // Vérifier que le restaurant n'a pas été créé
            const restaurants = await Restaurant.find({ name: restaurantData.restaurantName });
            expect(restaurants.length).toBe(0);
        });

        it('devrait refuser l\'accès pour un non-admin', async () => {
            const { token } = await createTestUser();

            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street',
                adminEmail: 'admin@example.com',
                adminName: 'Admin',
                adminPassword: 'password123',
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(403);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street',
                adminEmail: 'admin@example.com',
                adminName: 'Admin',
                adminPassword: 'password123',
            };

            const response = await request(app)
                .post('/foufoufood/admin/restaurants')
                .send(restaurantData);

            expect(response.status).toBe(401);
        });

        it('devrait normaliser l\'email de l\'admin en minuscules', async () => {
            const { token } = await createTestAdmin();

            const restaurantData = {
                restaurantName: 'Test Restaurant',
                restaurantAddress: '123 Main Street',
                adminEmail: `ADMIN${Date.now()}@EXAMPLE.COM`,
                adminName: 'Restaurant Admin',
                adminPassword: 'password123',
            };

            const response = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData
            );

            expect(response.status).toBe(201);
            expect(response.body.data.admin.email).toBe(restaurantData.adminEmail.toLowerCase());
        });

        it('devrait refuser si les champs requis sont manquants', async () => {
            const { token } = await createTestAdmin();

            // Test sans restaurantName
            const response1 = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                {
                    restaurantAddress: '123 Main Street',
                    adminEmail: 'admin@example.com',
                    adminName: 'Admin',
                    adminPassword: 'password123',
                }
            );

            expect(response1.status).toBeGreaterThanOrEqual(400); // Validation error

            // Test sans adminEmail
            const response2 = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                {
                    restaurantName: 'Test Restaurant',
                    restaurantAddress: '123 Main Street',
                    adminName: 'Admin',
                    adminPassword: 'password123',
                }
            );

            // Le service vérifie l'email et peut retourner une erreur
            expect([400, 500]).toContain(response2.status);
        });

        it('devrait permettre à un admin de créer plusieurs restaurants avec le même admin', async () => {
            const { token } = await createTestAdmin();
            
            // Créer le premier restaurant avec un nouvel admin
            const restaurantData1 = {
                restaurantName: 'First Restaurant',
                restaurantAddress: '123 First Street',
                adminEmail: `multirestaurant${Date.now()}@example.com`,
                adminName: 'Multi Restaurant Admin',
                adminPassword: 'password123',
            };

            const response1 = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData1
            );

            expect(response1.status).toBe(201);
            const adminId = response1.body.data.admin.id;

            // Créer un deuxième restaurant avec le même admin
            const restaurantData2 = {
                restaurantName: 'Second Restaurant',
                restaurantAddress: '456 Second Street',
                adminEmail: restaurantData1.adminEmail,
                adminName: restaurantData1.adminName,
                adminPassword: restaurantData1.adminPassword,
            };

            const response2 = await authenticatedRequest(
                'post',
                '/foufoufood/admin/restaurants',
                token,
                restaurantData2
            );

            expect(response2.status).toBe(201);
            expect(response2.body.data.admin.id).toBe(adminId);

            // Vérifier que l'admin a les deux restaurants
            const admin = await User.findById(adminId);
            expect(admin.restaurants.length).toBe(2);
        });
    });
});

