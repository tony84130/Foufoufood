import mongoose from 'mongoose';
import { MONGODB_URI, NODE_ENV } from '../config/env.js';

/**
 * Établit la connexion à la base de données MongoDB
 * @returns {Promise<void>} Affiche un message de succès ou quitte le processus en cas d'erreur
 */
const connectToDatabase = async () => {
    // En mode test, on ne connecte pas à la vraie base (MongoDB Memory Server est utilisé dans setup.js)
    if (NODE_ENV === 'test') {
        return;
    }

    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    try {
        await mongoose.connect(MONGODB_URI, { dbName: 'foufoufood'});

        console.log(`Connect to database in ${NODE_ENV} mode`);
    } catch (error) {
        console.error('DB connection failed', error);
        process.exit(1);
    }
};

export default connectToDatabase;