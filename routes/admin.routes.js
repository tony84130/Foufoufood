import { Router } from 'express';
import { authorize, checkRole } from '../middlewares/auth.middleware.js';
import { validateCreateRestaurantWithAdmin } from '../middlewares/validation.middleware.js';
import { createRestaurantWithAdmin } from '../controllers/admin.controller.js';

const adminRouter = Router();

// Toutes les routes ici nécessitent une authentification
adminRouter.use(authorize);

// Cette route est réservée aux administrateurs de la plateforme
adminRouter.post('/restaurants', checkRole(['platform_admin']), validateCreateRestaurantWithAdmin, createRestaurantWithAdmin);

export default adminRouter;
