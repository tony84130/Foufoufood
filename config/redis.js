import { createClient } from 'redis';
import { REDIS_URL, NODE_ENV } from './env.js';

// Mock Redis en mémoire pour les tests
const redisMockStore = new Map();
const redisMockExpiry = new Map();
const redisMockLists = new Map(); // Pour les listes Redis (lPush, lRange, etc.)

/**
 * Crée un mock du client Redis pour les tests
 * @returns {Object} Mock du client Redis
 */
function createRedisMock() {
    return {
        isReady: true,
        connect: async () => {},
        disconnect: async () => {},
        quit: async () => {},
        on: () => {}, // Mock pour les event listeners
        get: async (key) => {
            const expiry = redisMockExpiry.get(key);
            if (expiry && expiry < Date.now()) {
                redisMockStore.delete(key);
                redisMockExpiry.delete(key);
                redisMockLists.delete(key);
                return null;
            }
            return redisMockStore.get(key) || null;
        },
        set: async (key, value, options = {}) => {
            redisMockStore.set(key, value);
            if (options.EX) {
                // EX est en secondes, on convertit en millisecondes
                redisMockExpiry.set(key, Date.now() + (options.EX * 1000));
            }
        },
        del: async (...keys) => {
            let deleted = 0;
            keys.forEach(key => {
                if (redisMockStore.delete(key)) {
                    redisMockExpiry.delete(key);
                    deleted++;
                }
                if (redisMockLists.delete(key)) {
                    deleted++;
                }
            });
            return deleted;
        },
        keys: async (pattern) => {
            const keys = Array.from(redisMockStore.keys());
            if (pattern === '*') {
                return keys;
            }
            // Simple pattern matching (supporte * uniquement)
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return keys.filter(key => regex.test(key));
        },
        // Opérations sur les listes
        lPush: async (key, ...values) => {
            if (!redisMockLists.has(key)) {
                redisMockLists.set(key, []);
            }
            const list = redisMockLists.get(key);
            values.forEach(value => list.unshift(value)); // Ajouter au début
            return list.length;
        },
        lRange: async (key, start, end) => {
            if (!redisMockLists.has(key)) {
                return [];
            }
            const list = redisMockLists.get(key);
            const normalizedStart = start < 0 ? list.length + start : start;
            const normalizedEnd = end < 0 ? list.length + end + 1 : end + 1;
            return list.slice(normalizedStart, normalizedEnd);
        },
        lSet: async (key, index, value) => {
            if (!redisMockLists.has(key)) {
                return false;
            }
            const list = redisMockLists.get(key);
            if (index < 0 || index >= list.length) {
                return false;
            }
            list[index] = value;
            return true;
        },
        expire: async (key, seconds) => {
            if (redisMockStore.has(key) || redisMockLists.has(key)) {
                redisMockExpiry.set(key, Date.now() + (seconds * 1000));
                return true;
            }
            return false;
        },
    };
}

let redisClient;

// En mode test, utiliser le mock Redis
if (NODE_ENV === 'test') {
    redisClient = createRedisMock();
} else {
    // En mode développement/production, utiliser le vrai client Redis
    redisClient = createClient({
        url: REDIS_URL,
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error', err);
    });

    await redisClient.connect();
    console.log('Connected to Redis');

    process.on('SIGINT', async () => {
        if (redisClient.isReady) {
            await redisClient.quit();
            console.log('Redis client disconnected');
        }
        process.exit(0);
    });
}

export default redisClient;

// Export pour nettoyage en mode test (utilisé dans setup.js)
export function clearRedisMock() {
    if (NODE_ENV === 'test') {
        redisMockStore.clear();
        redisMockExpiry.clear();
        redisMockLists.clear();
    }
}
