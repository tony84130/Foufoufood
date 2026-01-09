import request from 'supertest';
import app from '../app.js';
import { 
    createTestUser,
    createTestRestaurantAdmin,
    createTestDeliveryPartner,
    createTestAdmin,
    authenticatedRequest 
} from './helpers.js';
import { notificationService } from '../services/notification.service.js';
import redisClient from '../config/redis.js';

describe('Notification Controller', () => {
    let clientToken;
    let clientUserId;

    beforeEach(async () => {
        const client = await createTestUser();
        clientToken = client.token;
        clientUserId = client.user._id.toString();
    });

    describe('GET /foufoufood/notifications/pending', () => {
        it('devrait retourner false et count 0 quand il n\'y a pas de notifications', async () => {
            const response = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.hasNewOrderNotification).toBe(false);
            expect(response.body.count).toBe(0);
        });

        it('devrait retourner true et le bon count quand il y a des notifications', async () => {
            // Créer des notifications dans Redis
            await notificationService.storeNotification(clientUserId, {
                type: 'order_confirmation',
                orderId: '507f1f77bcf86cd799439011',
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            await notificationService.storeNotification(clientUserId, {
                type: 'status_update',
                orderId: '507f1f77bcf86cd799439012',
                message: 'Votre commande est en cours de livraison',
                timestamp: new Date().toISOString()
            });

            const response = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.hasNewOrderNotification).toBe(true);
            expect(response.body.count).toBe(2);
        });

        it('devrait retourner les notifications pour le bon utilisateur seulement', async () => {
            const { token: otherClientToken, user: otherClient } = await createTestUser();

            // Créer des notifications pour le premier client
            await notificationService.storeNotification(clientUserId, {
                type: 'order_confirmation',
                orderId: '507f1f77bcf86cd799439011',
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            // Créer des notifications pour le deuxième client
            await notificationService.storeNotification(otherClient._id.toString(), {
                type: 'order_confirmation',
                orderId: '507f1f77bcf86cd799439013',
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            // Vérifier que chaque client voit seulement ses notifications
            const response1 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                clientToken
            );

            const response2 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                otherClientToken
            );

            expect(response1.status).toBe(200);
            expect(response1.body.count).toBe(1);
            expect(response2.status).toBe(200);
            expect(response2.body.count).toBe(1);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            const response = await request(app)
                .get('/foufoufood/notifications/pending');

            expect(response.status).toBe(401);
        });

        it('devrait accepter tous les rôles authentifiés', async () => {
            const { token: restaurantAdminToken } = await createTestRestaurantAdmin();
            const { token: deliveryToken } = await createTestDeliveryPartner();
            const { token: adminToken } = await createTestAdmin();

            const response1 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                restaurantAdminToken
            );

            const response2 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                deliveryToken
            );

            const response3 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                adminToken
            );

            // Tous les rôles peuvent accéder (pas de restriction dans le controller)
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            expect(response3.status).toBe(200);
        });
    });

    describe('DELETE /foufoufood/notifications/clear', () => {
        it('devrait effacer toutes les notifications de l\'utilisateur', async () => {
            // Créer plusieurs notifications
            await notificationService.storeNotification(clientUserId, {
                type: 'order_confirmation',
                orderId: '507f1f77bcf86cd799439011',
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            await notificationService.storeNotification(clientUserId, {
                type: 'status_update',
                orderId: '507f1f77bcf86cd799439012',
                message: 'Votre commande est en cours de livraison',
                timestamp: new Date().toISOString()
            });

            // Vérifier qu'il y a des notifications
            const beforeResponse = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                clientToken
            );
            expect(beforeResponse.body.count).toBe(2);

            // Effacer les notifications
            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/notifications/clear',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('effacées');

            // Vérifier qu'il n'y a plus de notifications
            const afterResponse = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                clientToken
            );
            expect(afterResponse.body.count).toBe(0);
            expect(afterResponse.body.hasNewOrderNotification).toBe(false);
        });

        it('devrait effacer seulement les notifications de l\'utilisateur connecté', async () => {
            const { token: otherClientToken, user: otherClient } = await createTestUser();

            // Créer des notifications pour les deux clients
            await notificationService.storeNotification(clientUserId, {
                type: 'order_confirmation',
                orderId: '507f1f77bcf86cd799439011',
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            await notificationService.storeNotification(otherClient._id.toString(), {
                type: 'order_confirmation',
                orderId: '507f1f77bcf86cd799439013',
                message: 'Votre commande a été confirmée !',
                timestamp: new Date().toISOString()
            });

            // Effacer les notifications du premier client
            await authenticatedRequest(
                'delete',
                '/foufoufood/notifications/clear',
                clientToken
            );

            // Vérifier que le premier client n'a plus de notifications
            const response1 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                clientToken
            );
            expect(response1.body.count).toBe(0);

            // Vérifier que le deuxième client a toujours ses notifications
            const response2 = await authenticatedRequest(
                'get',
                '/foufoufood/notifications/pending',
                otherClientToken
            );
            expect(response2.body.count).toBe(1);
        });

        it('devrait fonctionner même si l\'utilisateur n\'a pas de notifications', async () => {
            const response = await authenticatedRequest(
                'delete',
                '/foufoufood/notifications/clear',
                clientToken
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('devrait refuser l\'accès sans authentification', async () => {
            const response = await request(app)
                .delete('/foufoufood/notifications/clear');

            expect(response.status).toBe(401);
        });

        it('devrait accepter tous les rôles authentifiés', async () => {
            const { token: restaurantAdminToken } = await createTestRestaurantAdmin();
            const { token: deliveryToken } = await createTestDeliveryPartner();
            const { token: adminToken } = await createTestAdmin();

            const response1 = await authenticatedRequest(
                'delete',
                '/foufoufood/notifications/clear',
                restaurantAdminToken
            );

            const response2 = await authenticatedRequest(
                'delete',
                '/foufoufood/notifications/clear',
                deliveryToken
            );

            const response3 = await authenticatedRequest(
                'delete',
                '/foufoufood/notifications/clear',
                adminToken
            );

            // Tous les rôles peuvent accéder (pas de restriction dans le controller)
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            expect(response3.status).toBe(200);
        });
    });
});

