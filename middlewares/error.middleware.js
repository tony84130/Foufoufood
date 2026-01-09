/**
 * Middleware de gestion centralisée des erreurs
 * @param {Error} err - Objet d'erreur
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {void} Envoie une réponse JSON avec le message d'erreur
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    console.error(err);
    
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Server Error';
    
    if (err.name === 'CastError') {
        statusCode = 404;
        message = 'Resource not found';
    }

    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map(val => val.message);
        message = messages.join(', ');
    }

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

export default errorMiddleware;