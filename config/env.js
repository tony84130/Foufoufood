import 'dotenv/config'


export const {
    PORT,
    NODE_ENV,
    MONGODB_URI,
    REDIS_URL,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM
} = process.env;
