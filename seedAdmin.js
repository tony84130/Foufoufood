import bcrypt from 'bcryptjs';
import { User } from './models/user.model.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, NODE_ENV } from './config/env.js';

/**
 * Crée l'administrateur de la plateforme s'il n'existe pas déjà
 * @returns {Promise<void>} Ne retourne rien, quitte le processus en cas d'erreur
 */
export const seedAdmin = async () => {
    // Ne pas exécuter en mode test
    if (NODE_ENV === 'test') {
        return;
    }

    try {
        const existingAdmin = await User.findOne({ role: 'platform_admin' });
        if (existingAdmin) {
            console.log('Platform admin already exists.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'platform_admin'
        });

        console.log('Platform admin created successfully!');
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};
