import { Router } from 'express';
import { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    getCartStats, 
    validateCart 
} from '../controllers/cart.controller.js';
import { authorize, checkRole } from '../middlewares/auth.middleware.js';

const cartRouter = Router();

// Toutes les routes du panier nécessitent une authentification et le rôle client
cartRouter.use(authorize, checkRole(['client']));

// Obtenir le panier de l'utilisateur
cartRouter.get('/', getCart);

// Obtenir les statistiques du panier
cartRouter.get('/stats', getCartStats);

// Ajouter un item au panier
cartRouter.post('/items', addToCart);

// Mettre à jour la quantité d'un item dans le panier
cartRouter.put('/items/:menuItemId', updateCartItem);

// Supprimer un item du panier
cartRouter.delete('/items/:menuItemId', removeFromCart);

// Vider complètement le panier
cartRouter.delete('/', clearCart);

// Valider le panier avant de passer commande
cartRouter.post('/validate', validateCart);

export default cartRouter;
