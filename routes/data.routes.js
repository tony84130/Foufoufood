import { Router } from 'express';
import { detectMimeType } from '../middlewares/mime.middleware.js';
import { 
    getDataHome, 
    getRestaurantsList, 
    getRestaurantDetails,
    getRestaurantMenu,
    getMenuItemsList,
    getMenuItemDetails,
    getOrdersList,
    getOrderDetails
} from '../controllers/data.controller.js';

const dataRouter = Router();

// Middleware pour détecter le format MIME demandé
dataRouter.use(detectMimeType);

// Page d'accueil /data
dataRouter.get('/', getDataHome);

// Routes pour les restaurants
dataRouter.get('/restaurants', getRestaurantsList);
dataRouter.get('/restaurants/:id', getRestaurantDetails);
dataRouter.get('/restaurants/:id/menu', getRestaurantMenu);

// Routes pour les menus
dataRouter.get('/menus', getMenuItemsList);
dataRouter.get('/menus/:id', getMenuItemDetails);

// Routes pour les commandes
dataRouter.get('/orders', getOrdersList);
dataRouter.get('/orders/:id', getOrderDetails);

export default dataRouter;



