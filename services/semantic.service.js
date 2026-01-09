/**
 * Service pour générer des documents JSON-LD à partir des données de l'application
 * Utilise le vocabulaire Schema.org pour la modélisation
 */

import jsonld from 'jsonld';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Convertit un jour de la semaine en format Schema.org
 */
const dayToSchemaDay = (day) => {
    const dayMap = {
        'Mon': 'Monday',
        'Tue': 'Tuesday',
        'Wed': 'Wednesday',
        'Thu': 'Thursday',
        'Fri': 'Friday',
        'Sat': 'Saturday',
        'Sun': 'Sunday'
    };
    return dayMap[day] || day;
};

/**
 * Convertit un restaurant en JSON-LD selon Schema.org
 * @param {Object} restaurant - Objet restaurant
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>} - Document JSON-LD du restaurant
 */
export const restaurantToJsonLd = async (restaurant, baseUrl = BASE_URL, validate = false) => {
    // Gérer les IDs MongoDB (peuvent être ObjectId ou string)
    let restaurantId;
    if (restaurant.id) {
        restaurantId = restaurant.id.toString();
    } else if (restaurant._id) {
        restaurantId = restaurant._id.toString();
    } else {
        throw new Error('Restaurant must have an id or _id');
    }
    const restaurantUrl = `${baseUrl}/data/restaurants/${restaurantId}`;

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': restaurantUrl,
        '@type': 'Restaurant',
        'name': restaurant.name,
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': restaurant.address
        }
    };

    // Ajouter le téléphone si disponible
    if (restaurant.phone) {
        jsonLd['telephone'] = restaurant.phone;
    }

    // Ajouter le type de cuisine si disponible
    if (restaurant.cuisine) {
        jsonLd['servesCuisine'] = restaurant.cuisine;
    }

    // Ajouter les heures d'ouverture
    if (restaurant.openingHours && restaurant.openingHours.length > 0) {
        jsonLd['openingHoursSpecification'] = restaurant.openingHours.map(oh => ({
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': dayToSchemaDay(oh.day),
            'opens': oh.open,
            'closes': oh.close
        }));
    }

    // Ajouter la note moyenne
    if (restaurant.rating && restaurant.rating > 0) {
        jsonLd['aggregateRating'] = {
            '@type': 'AggregateRating',
            'ratingValue': restaurant.rating,
            'reviewCount': restaurant.reviews?.length || 0
        };
    }

    // Ajouter les avis individuels
    if (restaurant.reviews && restaurant.reviews.length > 0) {
        jsonLd['review'] = restaurant.reviews.map(review => {
            const reviewData = {
                '@type': 'Review',
                'reviewRating': {
                    '@type': 'Rating',
                    'ratingValue': review.rating
                }
            };

            if (review.comment) {
                reviewData['reviewBody'] = review.comment;
            }

            if (review.user && typeof review.user === 'object' && review.user.name) {
                reviewData['author'] = {
                    '@type': 'Person',
                    'name': review.user.name
                };
            }

            if (review.createdAt) {
                reviewData['datePublished'] = new Date(review.createdAt).toISOString();
            }

            return reviewData;
        });
    }

    // Ajouter un lien vers le menu (sans les détails du menu)
    if (restaurant.menu && restaurant.menu.length > 0) {
        jsonLd['hasMenu'] = {
            '@type': 'Menu',
            '@id': `${restaurantUrl}/menu`
        };
    }

    // Ajouter les dates de création et modification
    if (restaurant.createdAt) {
        jsonLd['dateCreated'] = new Date(restaurant.createdAt).toISOString();
    }
    if (restaurant.updatedAt) {
        jsonLd['dateModified'] = new Date(restaurant.updatedAt).toISOString();
    }

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

/**
 * Valide et normalise un document JSON-LD en utilisant la bibliothèque jsonld
 * @param {Object} jsonLd - Document JSON-LD à valider
 * @returns {Promise<Object>} - Document JSON-LD validé et normalisé
 */
export const validateAndNormalizeJsonLd = async (jsonLd) => {
    try {
        // Expansion : résout tous les contextes et les préfixes
        const expanded = await jsonld.expand(jsonLd);
        
        // Compaction : recompacte avec le contexte original pour un format propre
        const compacted = await jsonld.compact(expanded, jsonLd['@context']);
        
        return compacted;
    } catch (error) {
        console.warn('Erreur lors de la validation JSON-LD:', error.message);
        // En cas d'erreur, retourner le document original
        return jsonLd;
    }
};

/**
 * Convertit une liste de restaurants en JSON-LD (collection)
 * @param {Array} restaurants - Liste des restaurants
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>|Object} - Document JSON-LD de la collection
 */
export const restaurantsToJsonLd = async (restaurants, baseUrl = BASE_URL, validate = false) => {
    const collectionUrl = `${baseUrl}/data/restaurants`;

    // Convertir tous les restaurants en JSON-LD (en parallèle)
    const members = await Promise.all(
        restaurants.map(restaurant => restaurantToJsonLd(restaurant, baseUrl, false))
    );

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': collectionUrl,
        '@type': 'Collection',
        'name': 'Restaurants Collection',
        'description': 'Liste de tous les restaurants disponibles',
        'numberOfItems': restaurants.length,
        'member': members
    };

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

/**
 * Convertit un item de menu en JSON-LD selon Schema.org
 * @param {Object} menuItem - Objet menu item
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>} - Document JSON-LD du menu item
 */
export const menuItemToJsonLd = async (menuItem, baseUrl = BASE_URL, validate = false) => {
    // Gérer les IDs MongoDB
    let menuItemId;
    if (menuItem.id) {
        menuItemId = menuItem.id.toString();
    } else if (menuItem._id) {
        menuItemId = menuItem._id.toString();
    } else {
        throw new Error('MenuItem must have an id or _id');
    }
    const menuItemUrl = `${baseUrl}/data/menus/${menuItemId}`;

    // Gérer le restaurant (peut être un ID ou un objet)
    let restaurantId;
    if (menuItem.restaurant) {
        if (typeof menuItem.restaurant === 'object' && menuItem.restaurant._id) {
            restaurantId = menuItem.restaurant._id.toString();
        } else if (typeof menuItem.restaurant === 'object' && menuItem.restaurant.id) {
            restaurantId = menuItem.restaurant.id.toString();
        } else {
            restaurantId = menuItem.restaurant.toString();
        }
    }

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': menuItemUrl,
        '@type': 'MenuItem',
        'name': menuItem.name
    };

    // Ajouter la description si disponible
    if (menuItem.description) {
        jsonLd['description'] = menuItem.description;
    }

    // Ajouter le prix
    if (menuItem.price !== undefined) {
        jsonLd['offers'] = {
            '@type': 'Offer',
            'price': menuItem.price,
            'priceCurrency': 'CAD' // À adapter selon votre devise
        };
    }

    // Ajouter la catégorie
    if (menuItem.category) {
        jsonLd['category'] = menuItem.category;
    }

    // Ajouter l'image si disponible
    if (menuItem.image) {
        jsonLd['image'] = menuItem.image;
    }

    // Ajouter le lien vers le restaurant
    if (restaurantId) {
        jsonLd['menuAddOn'] = {
            '@type': 'Restaurant',
            '@id': `${baseUrl}/data/restaurants/${restaurantId}`
        };
    }

    // Ajouter les dates
    if (menuItem.createdAt) {
        jsonLd['dateCreated'] = new Date(menuItem.createdAt).toISOString();
    }
    if (menuItem.updatedAt) {
        jsonLd['dateModified'] = new Date(menuItem.updatedAt).toISOString();
    }

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

/**
 * Convertit une liste de menus en JSON-LD (collection)
 * @param {Array} menuItems - Liste des items de menu
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>} - Document JSON-LD de la collection
 */
export const menuItemsToJsonLd = async (menuItems, baseUrl = BASE_URL, validate = false) => {
    const collectionUrl = `${baseUrl}/data/menus`;

    // Convertir tous les menus en JSON-LD (en parallèle)
    const members = await Promise.all(
        menuItems.map(menuItem => menuItemToJsonLd(menuItem, baseUrl, false))
    );

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': collectionUrl,
        '@type': 'Collection',
        'name': 'Menu Items Collection',
        'description': 'Liste de tous les items de menu disponibles',
        'numberOfItems': menuItems.length,
        'member': members
    };

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

/**
 * Convertit une commande en JSON-LD selon Schema.org
 * @param {Object} order - Objet commande
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>} - Document JSON-LD de la commande
 */
export const orderToJsonLd = async (order, baseUrl = BASE_URL, validate = false) => {
    // Gérer les IDs MongoDB
    let orderId;
    if (order.id) {
        orderId = order.id.toString();
    } else if (order._id) {
        orderId = order._id.toString();
    } else {
        throw new Error('Order must have an id or _id');
    }
    const orderUrl = `${baseUrl}/data/orders/${orderId}`;

    // Gérer le restaurant
    let restaurantId;
    let restaurantName;
    if (order.restaurant) {
        if (typeof order.restaurant === 'object') {
            restaurantId = (order.restaurant._id || order.restaurant.id)?.toString();
            restaurantName = order.restaurant.name;
        } else {
            restaurantId = order.restaurant.toString();
        }
    }

    // Gérer l'utilisateur
    let userId;
    let userName;
    if (order.user) {
        if (typeof order.user === 'object') {
            userId = (order.user._id || order.user.id)?.toString();
            userName = order.user.name;
        } else {
            userId = order.user.toString();
        }
    }

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': orderUrl,
        '@type': 'Order',
        'orderNumber': orderId
    };

    // Ajouter le statut
    if (order.status) {
        jsonLd['orderStatus'] = order.status;
    }

    // Ajouter le client
    if (userId || userName) {
        jsonLd['customer'] = {
            '@type': 'Person',
            ...(userId && { '@id': `${baseUrl}/data/users/${userId}` }),
            ...(userName && { 'name': userName })
        };
    }

    // Ajouter le restaurant
    if (restaurantId) {
        jsonLd['seller'] = {
            '@type': 'Restaurant',
            '@id': `${baseUrl}/data/restaurants/${restaurantId}`,
            ...(restaurantName && { 'name': restaurantName })
        };
    }

    // Ajouter les items de commande
    if (order.items && order.items.length > 0) {
        jsonLd['orderedItem'] = order.items.map(item => {
            const itemData = {
                '@type': 'OrderItem',
                'name': item.name || 'Item',
                'quantity': item.quantity || 1
            };

            if (item.unitPrice !== undefined) {
                itemData['price'] = item.unitPrice;
            }

            if (item.total !== undefined) {
                itemData['totalPrice'] = item.total;
            }

            if (item.menuItem) {
                let menuItemId;
                if (typeof item.menuItem === 'object') {
                    menuItemId = (item.menuItem._id || item.menuItem.id)?.toString();
                } else {
                    menuItemId = item.menuItem.toString();
                }
                if (menuItemId) {
                    itemData['itemOffered'] = {
                        '@type': 'MenuItem',
                        '@id': `${baseUrl}/data/menus/${menuItemId}`
                    };
                }
            }

            if (item.notes) {
                itemData['description'] = item.notes;
            }

            return itemData;
        });
    }

    // Ajouter le prix total
    if (order.totalPrice !== undefined) {
        jsonLd['totalPrice'] = {
            '@type': 'PriceSpecification',
            'price': order.totalPrice,
            'priceCurrency': 'CAD'
        };
    }

    // Ajouter l'adresse de livraison
    if (order.deliveryAddress) {
        jsonLd['deliveryAddress'] = {
            '@type': 'PostalAddress',
            'streetAddress': order.deliveryAddress.line1,
            ...(order.deliveryAddress.line2 && { 'addressLocality': order.deliveryAddress.line2 }),
            'addressLocality': order.deliveryAddress.city,
            'addressRegion': order.deliveryAddress.region,
            'postalCode': order.deliveryAddress.postalCode,
            'addressCountry': order.deliveryAddress.country
        };
    }

    // Ajouter le partenaire de livraison
    if (order.deliveryPartner) {
        let deliveryPartnerId;
        if (typeof order.deliveryPartner === 'object') {
            deliveryPartnerId = (order.deliveryPartner._id || order.deliveryPartner.id)?.toString();
        } else {
            deliveryPartnerId = order.deliveryPartner.toString();
        }
        if (deliveryPartnerId) {
            jsonLd['deliveryAgent'] = {
                '@type': 'Person',
                '@id': `${baseUrl}/data/delivery-partners/${deliveryPartnerId}`
            };
        }
    }

    // Ajouter les dates
    if (order.createdAt) {
        jsonLd['orderDate'] = new Date(order.createdAt).toISOString();
    }
    if (order.updatedAt) {
        jsonLd['dateModified'] = new Date(order.updatedAt).toISOString();
    }

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

/**
 * Convertit une liste de commandes en JSON-LD (collection)
 * @param {Array} orders - Liste des commandes
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>} - Document JSON-LD de la collection
 */
export const ordersToJsonLd = async (orders, baseUrl = BASE_URL, validate = false) => {
    const collectionUrl = `${baseUrl}/data/orders`;

    // Convertir toutes les commandes en JSON-LD (en parallèle)
    const members = await Promise.all(
        orders.map(order => orderToJsonLd(order, baseUrl, false))
    );

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': collectionUrl,
        '@type': 'Collection',
        'name': 'Orders Collection',
        'description': 'Liste de toutes les commandes',
        'numberOfItems': orders.length,
        'member': members
    };

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

/**
 * Génère un document JSON-LD complet avec toutes les données de l'application
 * @param {Array} restaurants - Liste des restaurants
 * @param {Array} menuItems - Liste des items de menu
 * @param {Array} orders - Liste des commandes
 * @param {string} baseUrl - URL de base
 * @param {boolean} validate - Si true, valide le JSON-LD avec jsonld
 * @returns {Promise<Object>} - Document JSON-LD complet
 */
export const generateFullJsonLd = async (restaurants = [], menuItems = [], orders = [], baseUrl = BASE_URL, validate = false) => {
    const dataUrl = `${baseUrl}/data`;

    // Convertir toutes les données en JSON-LD (en parallèle)
    const [restaurantsJsonLd, menuItemsJsonLd, ordersJsonLd] = await Promise.all([
        Promise.all(restaurants.map(restaurant => restaurantToJsonLd(restaurant, baseUrl, false))),
        Promise.all(menuItems.map(menuItem => menuItemToJsonLd(menuItem, baseUrl, false))),
        Promise.all(orders.map(order => orderToJsonLd(order, baseUrl, false)))
    ]);

    const jsonLd = {
        '@context': {
            '@vocab': 'https://schema.org/',
            'foufoufood': `${baseUrl}/data/`
        },
        '@id': dataUrl,
        '@type': 'Dataset',
        'name': 'FoufouFood Data',
        'description': 'Données sémantiques de l\'application FoufouFood',
        'restaurants': restaurantsJsonLd,
        'menuItems': menuItemsJsonLd,
        'orders': ordersJsonLd
    };

    if (validate) {
        return await validateAndNormalizeJsonLd(jsonLd);
    }

    return jsonLd;
};

