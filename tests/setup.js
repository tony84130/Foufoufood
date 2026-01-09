// Configuration des variables d'environnement AVANT tout import
// Cette configuration doit être la première chose exécutée
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.PORT = process.env.PORT || '3000';
// MONGODB_URI n'est pas nécessaire en mode test (on utilise MongoDB Memory Server)
process.env.MONGODB_URI = 'mongodb://memory-server';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { clearRedisMock } from '../config/redis.js';

let mongoServer;

/**
 * Configuration globale avant tous les tests
 * Démarre une instance MongoDB en mémoire
 */
beforeAll(async () => {
    // Démarrer MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connecter Mongoose à la base en mémoire
    await mongoose.connect(mongoUri, {
        dbName: 'foufoufood-test',
    });

    console.log('✅ MongoDB Memory Server démarré');
});

/**
 * Nettoyage après chaque test
 * Vide toutes les collections pour isoler les tests
 */
afterEach(async () => {
    // Nettoyer MongoDB
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    
    // Nettoyer le mock Redis
    clearRedisMock();
});

/**
 * Nettoyage global après tous les tests
 * Ferme les connexions et arrête le serveur en mémoire
 */
afterAll(async () => {
    // Fermer la connexion Mongoose
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    // Arrêter MongoDB Memory Server
    if (mongoServer) {
        await mongoServer.stop();
    }

    // Nettoyer le mock Redis (déjà fait par clearRedisMock, mais on s'assure)
    clearRedisMock();

    console.log('✅ MongoDB Memory Server arrêté');
});

