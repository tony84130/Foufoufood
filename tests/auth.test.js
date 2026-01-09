import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { DeliveryPartner } from '../models/deliveryPartner.model.js';
import { createTestUser } from './helpers.js';

describe('Auth Controller', () => {
    describe('POST /foufoufood/auth/sign-up', () => {
        it('devrait créer un nouvel utilisateur client avec succès', async () => {
            const userData = {
                name: 'John Doe',
                email: `john${Date.now()}@example.com`,
                password: 'password123',
                role: 'client',
            };

            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.name).toBe(userData.name);
            expect(response.body.data.user.password).toBeUndefined();
        });

        it('devrait créer un delivery_partner avec succès', async () => {
            const userData = {
                name: 'Delivery Person',
                email: `delivery${Date.now()}@example.com`,
                password: 'password123',
                role: 'delivery_partner',
            };

            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.role).toBe('delivery_partner');
        });

        it('devrait refuser la création avec un email existant', async () => {
            const email = `existing${Date.now()}@example.com`;
            
            await createTestUser({ email });

            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Another User',
                    email,
                    password: 'password123',
                    role: 'client',
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        it('devrait normaliser l\'email en minuscules', async () => {
            const email = `UPPERCASE${Date.now()}@EXAMPLE.COM`;
            
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Test User',
                    email,
                    password: 'password123',
                    role: 'client',
                });

            expect(response.status).toBe(201);
            expect(response.body.data.user.email).toBe(email.toLowerCase());
        });

        it('devrait créer un utilisateur avec phone et address', async () => {
            const userData = {
                name: 'Complete User',
                email: `complete${Date.now()}@example.com`,
                password: 'password123',
                role: 'client',
                phone: '+1234567890',
                address: {
                    line1: '123 Main St',
                    city: 'Montreal',
                    postalCode: 'H1A 1A1',
                    country: 'Canada'
                }
            };

            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.data.user.phone).toBe(userData.phone);
            expect(response.body.data.user.address.city).toBe(userData.address.city);
        });

        it('devrait créer automatiquement un DeliveryPartner pour delivery_partner', async () => {
            const userData = {
                name: 'Delivery Test',
                email: `deliverytest${Date.now()}@example.com`,
                password: 'password123',
                role: 'delivery_partner',
            };

            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send(userData);

            expect(response.status).toBe(201);
            
            // Récupérer l'utilisateur depuis la base pour obtenir son _id
            const createdUser = await User.findOne({ email: userData.email.toLowerCase() });
            expect(createdUser).toBeTruthy();
            
            const deliveryPartner = await DeliveryPartner.findOne({ user: createdUser._id });
            expect(deliveryPartner).toBeTruthy();
            expect(deliveryPartner.user.toString()).toBe(createdUser._id.toString());
        });

        it('devrait refuser la création avec un rôle invalide', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Admin User',
                    email: `admin${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'platform_admin',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid role');
        });

        it('devrait refuser la création sans email', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Test User',
                    password: 'password123',
                    role: 'client',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('devrait refuser la création sans nom', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    email: `noname${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'client',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('devrait refuser la création avec un nom trop court (moins de 2 caractères)', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'A',
                    email: `shortname${Date.now()}@example.com`,
                    password: 'password123',
                    role: 'client',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('devrait refuser la création avec un email invalide', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'password123',
                    role: 'client',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('devrait refuser la création avec un mot de passe trop court', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Test User',
                    email: `shortpass${Date.now()}@example.com`,
                    password: '12345',
                    role: 'client',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('devrait refuser la création sans mot de passe', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Test User',
                    email: `nopass${Date.now()}@example.com`,
                    role: 'client',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('devrait normaliser l\'email avec des espaces (trim)', async () => {
            const timestamp = Date.now();
            const emailWithSpaces = `  spaced${timestamp}@example.com  `;
            
            const response = await request(app)
                .post('/foufoufood/auth/sign-up')
                .send({
                    name: 'Test User',
                    email: emailWithSpaces,
                    password: 'password123',
                    role: 'client',
                });

            // L'email devrait être normalisé (trim + lowercase)
            expect(response.status).toBe(201);
            expect(response.body.data.user.email).toBe(`spaced${timestamp}@example.com`);
        });
    });

    describe('POST /foufoufood/auth/sign-in', () => {
        it('devrait connecter un utilisateur avec des identifiants valides', async () => {
            const { user } = await createTestUser({
                email: `login${Date.now()}@example.com`,
                password: 'password123',
            });

            const response = await request(app)
                .post('/foufoufood/auth/sign-in')
                .send({
                    email: user.email,
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe(user.email);
        });

        it('devrait refuser la connexion avec un mot de passe incorrect', async () => {
            const { user } = await createTestUser({
                email: `wrongpass${Date.now()}@example.com`,
                password: 'password123',
            });

            const response = await request(app)
                .post('/foufoufood/auth/sign-in')
                .send({
                    email: user.email,
                    password: 'wrongpassword',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid password');
        });

        it('devrait refuser la connexion avec un email inexistant', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-in')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('User not found');
        });

        it('devrait normaliser l\'email en minuscules lors de la connexion', async () => {
            const email = `UPPERCASE${Date.now()}@EXAMPLE.COM`;
            await createTestUser({ email });

            const response = await request(app)
                .post('/foufoufood/auth/sign-in')
                .send({
                    email: email.toUpperCase(),
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
        });

        it('devrait révoquer l\'ancien token lors d\'une nouvelle connexion', async () => {
            const { user, token: oldToken } = await createTestUser({
                email: `reconnect${Date.now()}@example.com`,
                password: 'password123',
            });

            // Nouvelle connexion
            const response = await request(app)
                .post('/foufoufood/auth/sign-in')
                .send({
                    email: user.email,
                    password: 'password123',
                });

            expect(response.status).toBe(200);
            const newToken = response.body.data.token;

            // L'ancien token devrait être révoqué (ne peut plus être utilisé)
            const checkOldToken = await request(app)
                .get('/foufoufood/users/me')
                .set('Authorization', `Bearer ${oldToken}`);
            expect(checkOldToken.status).toBe(401);

            // Le nouveau token devrait fonctionner
            const checkNewToken = await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', `Bearer ${newToken}`);

            expect(checkNewToken.status).toBe(200);
        });

        it('devrait empêcher la connexion si déjà connecté (preventIfLoggedIn)', async () => {
            const { user, token } = await createTestUser({
                email: `alreadylogged${Date.now()}@example.com`,
                password: 'password123',
            });

            // Tentative de connexion alors qu'un token valide existe
            const response = await request(app)
                .post('/foufoufood/auth/sign-in')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: user.email,
                    password: 'password123',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already logged in');
        });
    });

    describe('POST /foufoufood/auth/sign-out', () => {
        it('devrait déconnecter un utilisateur avec un token valide', async () => {
            const { token } = await createTestUser();

            const response = await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User signed out successfully');
        });

        it('devrait refuser la déconnexion sans token', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-out');

            expect(response.status).toBe(401);
        });

        it('devrait refuser la déconnexion avec un token invalide', async () => {
            const response = await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        it('devrait refuser la déconnexion avec un token révoqué', async () => {
            const { token } = await createTestUser();

            // Déconnexion première fois
            await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', `Bearer ${token}`);

            // Tentative de déconnexion avec le même token révoqué
            const response = await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('revoked');
        });

        it('devrait refuser l\'accès avec un token révoqué', async () => {
            const { token } = await createTestUser();

            // Déconnexion
            await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', `Bearer ${token}`);

            // Tentative d'utiliser le token révoqué pour une autre route protégée
            const response = await request(app)
                .get('/foufoufood/users/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('revoked');
        });

        it('devrait refuser la déconnexion sans token dans Authorization', async () => {
            // Note: La route utilise le middleware authorize qui retourne 401 si pas de token valide
            // Le header "Bearer " (sans token) est intercepté par authorize avant d'atteindre le controller
            const response = await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', 'Bearer');

            // Le middleware authorize vérifie d'abord et retourne 401 pour un token invalide
            expect(response.status).toBe(401);
            expect(response.body.message).toBeDefined();
        });

        it('devrait refuser la déconnexion avec un token expiré', async () => {
            // Créer un token avec expiration très courte
            const jwt = (await import('jsonwebtoken')).default;
            const { JWT_SECRET } = await import('../config/env.js');
            const { user } = await createTestUser();
            
            const expiredToken = jwt.sign(
                { userId: user.id },
                JWT_SECRET,
                { expiresIn: '-1h' } // Expiré
            );

            const response = await request(app)
                .post('/foufoufood/auth/sign-out')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
        });
    });

    describe('Middleware authorize', () => {
        it('devrait autoriser l\'accès avec un token valide', async () => {
            const { token } = await createTestUser();

            const response = await request(app)
                .get('/foufoufood/users/profile')
                .set('Authorization', `Bearer ${token}`);

            // La route pourrait ne pas exister, mais si elle existe, elle devrait retourner 200 ou 404, pas 401
            expect([200, 404]).toContain(response.status);
        });

        it('devrait refuser l\'accès sans token', async () => {
            const response = await request(app)
                .get('/foufoufood/users/profile');

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('no token');
        });

        it('devrait refuser l\'accès avec un token mal formaté', async () => {
            const response = await request(app)
                .get('/foufoufood/users/profile')
                .set('Authorization', 'InvalidFormat token123');

            expect(response.status).toBe(401);
        });

        it('devrait refuser l\'accès si l\'utilisateur n\'existe plus', async () => {
            const { token, user } = await createTestUser();

            // Supprimer l'utilisateur
            await User.findByIdAndDelete(user.id);

            const response = await request(app)
                .get('/foufoufood/users/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toContain('User not found');
        });
    });
});

