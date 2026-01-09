import { Router } from 'express';

import { authorize, checkRole } from '../middlewares/auth.middleware.js';
import {
    getUsers,
    searchUsers,
    getUser,
    getCurrentUser, 
    updateCurrentUser,
    deleteUser,
    deleteCurrentUser,
} from '../controllers/user.controller.js';

const userRouter = Router();

// Routes Administrateur
userRouter.get('/', authorize, checkRole(['platform_admin']), getUsers);
userRouter.get('/search', authorize, checkRole(['platform_admin']), searchUsers);

// Route Utilisateur (pour le profil) - DOIT être avant /:id
userRouter.get('/me', authorize, getCurrentUser);
userRouter.put('/me', authorize, updateCurrentUser);
userRouter.delete('/me', authorize, deleteCurrentUser);

// Routes Administrateur avec ID (doivent être après /me)
userRouter.delete('/:id', authorize, checkRole(['platform_admin']), deleteUser);

// Route Utilisateur par ID (pour l'administration ou la recherche si non-admin est autorisé)
userRouter.get('/:id', authorize, getUser);

export default userRouter;
