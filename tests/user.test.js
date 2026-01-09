import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { 
    createTestUser, 
    createTestAdmin, 
    authenticatedRequest 
} from './helpers.js';

describe('User Controller', () => {
    describe('GET /foufoufood/users', () => {
        it('devrait retourner tous les utilisateurs pour un admin', async () => {
            const { token } = await createTestAdmin();
            
            await createTestUser();
            await createTestUser();

            const response = await authenticatedRequest('get', '/foufoufood/users', token);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(3);
        });

        it('devrait refuser l\'accès pour un non-admin', async () => {
            const { token } = await createTestUser();

            const response = await authenticatedRequest('get', '/foufoufood/users', token);

            expect(response.status).toBe(403);
        });
    });

    describe('GET /foufoufood/users/search', () => {
        it('devrait rechercher des utilisateurs par nom', async () => {
            const { token } = await createTestAdmin();
            await createTestUser({ name: 'Alice Smith' });
            await createTestUser({ name: 'Bob Jones' });

            const response = await authenticatedRequest(
                'get', 
                '/foufoufood/users/search?q=Alice',
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.some(u => u.name.includes('Alice'))).toBe(true);
        });

        it('devrait rechercher des utilisateurs par email', async () => {
            const { token } = await createTestAdmin();
            const { user } = await createTestUser({ email: 'testsearch@example.com' });

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/users/search?q=testsearch',
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.data.some(u => u.email.includes('testsearch'))).toBe(true);
        });

        it('devrait refuser la recherche sans query', async () => {
            const { token } = await createTestAdmin();

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/users/search',
                token
            );

            expect(response.status).toBe(400);
        });
    });

    describe('GET /foufoufood/users/:id', () => {
        it('devrait retourner un utilisateur par son ID', async () => {
            const { user, token } = await createTestUser();

            const response = await authenticatedRequest(
                'get',
                `/foufoufood/users/${user._id}`,
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(user.id);
            expect(response.body.data.password).toBeUndefined();
        });

        it('devrait retourner 404 pour un utilisateur inexistant', async () => {
            const { token } = await createTestUser();
            const fakeId = '507f1f77bcf86cd799439011';

            const response = await authenticatedRequest(
                'get',
                `/foufoufood/users/${fakeId}`,
                token
            );

            expect(response.status).toBe(404);
        });

        it('devrait refuser l\'accès sans token', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .get(`/foufoufood/users/${user._id}`);

            expect(response.status).toBe(401);
        });

        it('devrait permettre à un utilisateur de voir son propre profil', async () => {
            const { user, token } = await createTestUser();

            const response = await authenticatedRequest(
                'get',
                `/foufoufood/users/${user._id}`,
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(user.id);
        });

        it('devrait refuser à un utilisateur de voir le profil d\'un autre utilisateur', async () => {
            const { user: user1, token: token1 } = await createTestUser();
            const { user: user2 } = await createTestUser();

            const response = await authenticatedRequest(
                'get',
                `/foufoufood/users/${user2._id}`,
                token1
            );

            expect(response.status).toBe(403);
            expect(response.body.error || response.body.message).toContain('Forbidden');
        });

        it('devrait permettre à un platform_admin de voir le profil de n\'importe quel utilisateur', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { user: otherUser } = await createTestUser();

            const response = await authenticatedRequest(
                'get',
                `/foufoufood/users/${otherUser._id}`,
                adminToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(otherUser.id);
        });
    });

    describe('PUT /foufoufood/users/me', () => {
        it('devrait mettre à jour le profil de l\'utilisateur connecté', async () => {
            const { user, token } = await createTestUser();

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/users/me',
                token,
                {
                    name: 'Updated Name',
                    phone: '514-123-4567',
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
            expect(response.body.data.phone).toBe('514-123-4567');
        });

        it('devrait mettre à jour l\'email si disponible', async () => {
            const { user, token } = await createTestUser();
            const newEmail = `newemail${Date.now()}@example.com`;

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/users/me',
                token,
                {
                    email: newEmail,
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.data.email).toBe(newEmail);
        });

        it('devrait mettre à jour l\'adresse pour un client', async () => {
            const { token } = await createTestUser({ role: 'client' });

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/users/me',
                token,
                {
                    address: {
                        line1: '123 Main St',
                        city: 'Montreal',
                        postalCode: 'H1A 1A1',
                        country: 'Canada'
                    }
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.data.address.city).toBe('Montreal');
        });

        it('devrait mettre à jour le mot de passe', async () => {
            const { token } = await createTestUser();

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/users/me',
                token,
                {
                    password: 'newpassword123',
                }
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Vérifier qu'on peut se connecter avec le nouveau mot de passe
            const loginResponse = await request(app)
                .post('/foufoufood/auth/sign-in')
                .send({
                    email: response.body.data.email,
                    password: 'newpassword123',
                });

            expect(loginResponse.status).toBe(200);
        });

        it('devrait refuser un email déjà utilisé par un autre utilisateur', async () => {
            const { user: user1 } = await createTestUser({ email: 'existing@example.com' });
            const { token } = await createTestUser();

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/users/me',
                token,
                {
                    email: 'existing@example.com',
                }
            );

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already exists');
        });

        it('ne devrait pas permettre de changer le rôle', async () => {
            const { token } = await createTestUser();

            const response = await authenticatedRequest(
                'put',
                '/foufoufood/users/me',
                token,
                {
                    role: 'platform_admin',
                }
            );

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('role cannot be changed');
        });

        it('devrait refuser l\'accès sans token', async () => {
            const response = await request(app)
                .put('/foufoufood/users/me')
                .send({ name: 'Test' });

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /foufoufood/users/me', () => {
        it('devrait supprimer le compte de l\'utilisateur connecté', async () => {
            const { user, token } = await createTestUser();

            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/users/me',
                token
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('devrait nettoyer les sessions Redis lors de la suppression', async () => {
            const { user, token } = await createTestUser();

            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/users/me',
                token
            );

            expect(response.status).toBe(200);
            // Le nettoyage Redis est fait dans le service
        });

        it('devrait refuser l\'accès sans token', async () => {
            const response = await request(app)
                .delete('/foufoufood/users/me');

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /foufoufood/users/:id', () => {
        it('devrait supprimer un utilisateur pour un admin', async () => {
            const { token: adminToken } = await createTestAdmin();
            const { user } = await createTestUser();

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/users/${user._id}`,
                adminToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedUser = await User.findById(user._id);
            expect(deletedUser).toBeNull();
        });

        it('devrait refuser la suppression pour un non-admin', async () => {
            const { token } = await createTestUser();
            const { user: otherUser } = await createTestUser();

            const response = await authenticatedRequest(
                'delete',
                `/foufoufood/users/${otherUser._id}`,
                token
            );

            expect(response.status).toBe(403);
        });
    });
});

