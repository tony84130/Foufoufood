import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

import { PORT } from './config/env.js';
import connectToDatabase from './config/db.js';
import { seedAdmin } from './seedAdmin.js';
import { notificationService } from './services/notification.service.js';

import adminRouter from './routes/admin.routes.js';
import authRouter from './routes/auth.routes.js';
import cartRouter from './routes/cart.routes.js';
import dataRouter from './routes/data.routes.js';
import menuRouter from './routes/menu.routes.js';
import orderRouter from './routes/order.routes.js';
import restaurantRouter from './routes/restaurant.routes.js';
import trackingRouter from './routes/tracking.routes.js';
import userRouter from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';

import errorMiddleware from './middlewares/error.middleware.js';

const app = express();
const server = createServer(app);

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// INITIALIZE SOCKET.IO
notificationService.initialize(server);

// CONNECT DB
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, async () => {
        console.log(`Foufoufood server is running on http://localhost:${PORT}`);
        console.log(`WebSocket server is running for real-time notifications`);
    
        await connectToDatabase();
        await seedAdmin();
    });
}

// APP ENTRY MESSAGE
app.get('/', (req, res) => {
    res.send('Welcome to foufoufood server API !');
});

// ROUTES
app.use('/data', dataRouter);
app.use('/foufoufood/admin', adminRouter);
app.use('/foufoufood/auth', authRouter);
app.use('/foufoufood/cart', cartRouter);
app.use('/foufoufood/menus', menuRouter);
app.use('/foufoufood/orders', orderRouter);
app.use('/foufoufood/restaurants', restaurantRouter);
app.use('/foufoufood/tracking', trackingRouter);
app.use('/foufoufood/users', userRouter);
app.use('/foufoufood/notifications', notificationRoutes);

// ERROR
app.use(errorMiddleware);

export default app;
export { server };

// créée le container docker : docker run -d --name redis-local -p 6379:6379 -v redis-data:/data redis:7 redis-server --appendonly yes
// démarrer le conteneur : docker start redis-local
// vérifier que le conteneur est lancer : docker ps
// stopper le shell Redis : QUIT
// arrêter le conteneur Redis : docker stop redis-local
