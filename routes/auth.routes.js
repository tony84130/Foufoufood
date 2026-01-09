import { Router } from 'express';

import { signUp, signIn, signOut } from '../controllers/auth.controller.js';
import { preventIfLoggedIn, authorize } from '../middlewares/auth.middleware.js';

const authRouter = Router();

authRouter.post('/sign-up', preventIfLoggedIn, signUp);
authRouter.post('/sign-in', preventIfLoggedIn, signIn);
authRouter.post('/sign-out', authorize, signOut);

export default authRouter;
