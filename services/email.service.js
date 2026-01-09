import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } from '../config/env.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    /**
     * Initialise le transporteur email
     */
    async initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: EMAIL_HOST,
                port: EMAIL_PORT,
                secure: EMAIL_PORT === 465, // true pour 465, false pour autres ports
                auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_PASS
                }
            });

            // Vérifier la connexion
            await this.transporter.verify();
            console.log('✅ Service email configuré avec succès');
        } catch (error) {
            console.error('❌ Erreur configuration email:', error.message);
            // En mode développement, on peut utiliser un transporteur de test
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                auth: {
                    user: 'ethereal.user@ethereal.email',
                    pass: 'ethereal.pass'
                }
            });
        }
    }

    /**
     * Envoie une confirmation de commande
     * @param {Object} order - Commande à confirmer
     * @param {Object} user - Utilisateur destinataire
     * @returns {Object} Résultat de l'envoi
     */
    async sendOrderConfirmation(order, user) {
        try {
            const mailOptions = {
                from: EMAIL_FROM || 'noreply@foufoufood.com',
                to: user.email,
                subject: `🍕 Confirmation de commande #${order.id}`,
                html: this.generateOrderConfirmationTemplate(order, user)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de confirmation envoyé à ${user.email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Erreur envoi email confirmation:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envoie une notification de changement de statut
     * @param {Object} order - Commande mise à jour
     * @param {Object} user - Utilisateur destinataire
     * @param {String} oldStatus - Ancien statut
     * @param {String} newStatus - Nouveau statut
     * @returns {Object} Résultat de l'envoi
     */
    async sendStatusUpdateNotification(order, user, oldStatus, newStatus) {
        try {
            const mailOptions = {
                from: EMAIL_FROM || 'noreply@foufoufood.com',
                to: user.email,
                subject: `📦 Mise à jour de votre commande #${order.id}`,
                html: this.generateStatusUpdateTemplate(order, user, oldStatus, newStatus)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de mise à jour envoyé à ${user.email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Erreur envoi email mise à jour:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envoie une notification de livraison
     * @param {Object} order - Commande livrée
     * @param {Object} user - Utilisateur destinataire
     * @param {Object} deliveryPartner - Livreur
     * @returns {Object} Résultat de l'envoi
     */
    async sendDeliveryNotification(order, user, deliveryPartner) {
        try {
            const mailOptions = {
                from: EMAIL_FROM || 'noreply@foufoufood.com',
                to: user.email,
                subject: `🚚 Votre commande #${order.id} a été livrée !`,
                html: this.generateDeliveryTemplate(order, user, deliveryPartner)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email de livraison envoyé à ${user.email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Erreur envoi email livraison:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Génère le template HTML pour la confirmation de commande
     * @param {Object} order - Commande
     * @param {Object} user - Utilisateur
     * @returns {String} Template HTML
     */
    generateOrderConfirmationTemplate(order, user) {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.unitPrice}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.total}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Confirmation de commande FouFouFood</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { text-align: left; padding: 10px; }
                    th { background: #f5f5f5; font-weight: bold; }
                    .total { font-size: 18px; font-weight: bold; color: #ff6b35; }
                    .status { display: inline-block; padding: 5px 15px; background: #28a745; color: white; border-radius: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍕 FouFouFood</h1>
                        <h2>Confirmation de commande</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour ${user.name},</p>
                        <p>Votre commande a été enregistrée avec succès ! Voici les détails :</p>
                        
                        <div class="order-details">
                            <h3>📋 Détails de la commande</h3>
                            <p><strong>Numéro de commande :</strong> #${order.id}</p>
                            <p><strong>Restaurant :</strong> ${order.restaurant.name}</p>
                            <p><strong>Statut :</strong> <span class="status">${order.status}</span></p>
                            <p><strong>Date :</strong> ${new Date(order.createdAt).toLocaleString('fr-FR')}</p>
                            
                            <h4>🍽️ Articles commandés</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Article</th>
                                        <th>Quantité</th>
                                        <th>Prix unitaire</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                            
                            <div class="total">
                                <strong>Total : $${order.totalPrice}</strong>
                            </div>
                            
                            <h4>📍 Adresse de livraison</h4>
                            <p>
                                ${order.deliveryAddress.line1}<br>
                                ${order.deliveryAddress.line2 ? order.deliveryAddress.line2 + '<br>' : ''}
                                ${order.deliveryAddress.city}, ${order.deliveryAddress.region}<br>
                                ${order.deliveryAddress.postalCode}, ${order.deliveryAddress.country}
                            </p>
                        </div>
                        
                        <p>Vous recevrez une notification par email à chaque mise à jour de votre commande.</p>
                        <p>Merci d'avoir choisi FouFouFood ! 🍕</p>
                    </div>
                    <div class="footer">
                        <p>FouFouFood - Service de livraison de repas</p>
                        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Génère le template HTML pour la mise à jour de statut
     * @param {Object} order - Commande
     * @param {Object} user - Utilisateur
     * @param {String} oldStatus - Ancien statut
     * @param {String} newStatus - Nouveau statut
     * @returns {String} Template HTML
     */
    generateStatusUpdateTemplate(order, user, oldStatus, newStatus) {
        const statusMessages = {
            'En attente': 'Votre commande est en attente de confirmation',
            'Confirmée': 'Votre commande a été confirmée par le restaurant',
            'Préparée': 'Votre commande est prête et sera bientôt en livraison',
            'En livraison': 'Votre commande est en cours de livraison',
            'Livrée': 'Votre commande a été livrée avec succès !',
            'Annulée': 'Votre commande a été annulée'
        };

        const statusColors = {
            'En attente': '#ffc107',
            'Confirmée': '#17a2b8',
            'Préparée': '#28a745',
            'En livraison': '#007bff',
            'Livrée': '#28a745',
            'Annulée': '#dc3545'
        };

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Mise à jour de commande FouFouFood</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                    .status { display: inline-block; padding: 10px 20px; color: white; border-radius: 25px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🍕 FouFouFood</h1>
                        <h2>Mise à jour de votre commande</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour ${user.name},</p>
                        <p>Votre commande #${order.id} a été mise à jour :</p>
                        
                        <div class="status-update">
                            <h3>📦 Statut de la commande</h3>
                            <p><strong>Restaurant :</strong> ${order.restaurant.name}</p>
                            <p><strong>Ancien statut :</strong> ${oldStatus}</p>
                            <p><strong>Nouveau statut :</strong> 
                                <span class="status" style="background-color: ${statusColors[newStatus]}">
                                    ${newStatus}
                                </span>
                            </p>
                            <p><strong>Message :</strong> ${statusMessages[newStatus]}</p>
                            
                            ${order.deliveryPartner ? `
                                <h4>🚚 Informations de livraison</h4>
                                <p><strong>Livreur :</strong> ${order.deliveryPartner.user.name}</p>
                                <p><strong>Contact :</strong> ${order.deliveryPartner.user.phone || 'Non disponible'}</p>
                            ` : ''}
                        </div>
                        
                        <p>Vous pouvez suivre votre commande en temps réel sur notre application.</p>
                        <p>Merci d'avoir choisi FouFouFood ! 🍕</p>
                    </div>
                    <div class="footer">
                        <p>FouFouFood - Service de livraison de repas</p>
                        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Génère le template HTML pour la livraison
     * @param {Object} order - Commande
     * @param {Object} user - Utilisateur
     * @param {Object} deliveryPartner - Livreur
     * @returns {String} Template HTML
     */
    generateDeliveryTemplate(order, user, deliveryPartner) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Commande livrée FouFouFood</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .delivery-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
                    .footer { text-align: center; margin-top: 30px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚚 FouFouFood</h1>
                        <h2>Commande livrée !</h2>
                    </div>
                    <div class="content">
                        <p>Bonjour ${user.name},</p>
                        <p>Excellente nouvelle ! Votre commande a été livrée avec succès ! 🎉</p>
                        
                        <div class="delivery-info">
                            <h3>📦 Détails de la livraison</h3>
                            <p><strong>Commande :</strong> #${order.id}</p>
                            <p><strong>Restaurant :</strong> ${order.restaurant.name}</p>
                            <p><strong>Livreur :</strong> ${deliveryPartner.user.name}</p>
                            <p><strong>Heure de livraison :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                        </div>
                        
                        <p>Nous espérons que vous apprécierez votre repas !</p>
                        <p>N'hésitez pas à nous laisser un avis sur votre expérience.</p>
                        <p>Merci d'avoir choisi FouFouFood ! 🍕</p>
                    </div>
                    <div class="footer">
                        <p>FouFouFood - Service de livraison de repas</p>
                        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

export const emailService = new EmailService();
