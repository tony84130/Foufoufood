/**
 * Middleware pour détecter le type MIME demandé via l'en-tête Accept
 * Détermine si le client demande du HTML ou du JSON-LD
 */

/**
 * Parse l'en-tête Accept et détermine le format préféré
 * @param {string} acceptHeader - L'en-tête Accept de la requête
 * @returns {string} - 'html' ou 'jsonld'
 */
export const parseAcceptHeader = (acceptHeader) => {
    if (!acceptHeader) {
        return 'html'; // Par défaut, retourner HTML
    }

    // Normaliser l'en-tête (enlever les espaces, convertir en minuscules)
    const normalized = acceptHeader.toLowerCase().replace(/\s/g, '');

    // Vérifier pour JSON-LD (application/ld+json)
    if (normalized.includes('application/ld+json')) {
        return 'jsonld';
    }

    // Vérifier pour JSON-LD avec alias (application/json avec mention de ld)
    if (normalized.includes('application/json') && normalized.includes('ld')) {
        return 'jsonld';
    }

    // Par défaut, retourner HTML
    return 'html';
};

/**
 * Middleware Express pour ajouter le format détecté à la requête
 */
export const detectMimeType = (req, res, next) => {
    const acceptHeader = req.headers.accept || '';
    req.requestedFormat = parseAcceptHeader(acceptHeader);
    next();
};



