import { Restaurant } from '../models/restaurant.model.js';
import { Menu } from '../models/menu.model.js';
import { Order } from '../models/order.model.js';
import { 
    restaurantToJsonLd, 
    restaurantsToJsonLd,
    menuItemToJsonLd,
    menuItemsToJsonLd,
    orderToJsonLd,
    ordersToJsonLd,
    generateFullJsonLd 
} from '../services/semantic.service.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Page d'accueil de l'API /data
 * Retourne soit une page HTML explicative, soit un document JSON-LD complet
 */
export const getDataHome = async (req, res, next) => {
    try {
        const format = req.requestedFormat || 'html';

        if (format === 'jsonld') {
            // Récupérer toutes les données
            const [restaurants, menuItems, orders] = await Promise.all([
                Restaurant.find().populate('reviews.user', 'name email').lean(),
                Menu.find().populate('restaurant', 'name').lean(),
                Order.find()
                    .populate('restaurant', 'name address')
                    .populate('user', 'name email')
                    .populate('items.menuItem', 'name')
                    .populate('deliveryPartner', 'user')
                    .lean()
            ]);

            // Générer le JSON-LD avec toutes les données
            const jsonLd = await generateFullJsonLd(restaurants, menuItems, orders, BASE_URL, false);

            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Page d'accueil explicative
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FoufouFood - API Web Sémantique</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }
        pre {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #4CAF50;
        }
        .route {
            background-color: #e8f5e9;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .method {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 3px 8px;
            border-radius: 3px;
            font-weight: bold;
            margin-right: 10px;
        }
        .format-badge {
            display: inline-block;
            background-color: #2196F3;
            color: white;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            margin-left: 10px;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍽️ FoufouFood - API Web Sémantique</h1>
        
        <p>Bienvenue sur l'API web sémantique de FoufouFood. Cette API expose les données des restaurants, menus et commandes au format JSON-LD (Linked Data) selon le vocabulaire Schema.org.</p>

        <h2>📋 Comment utiliser cette API</h2>
        <p>Cette API supporte deux formats de réponse selon l'en-tête HTTP <code>Accept</code> :</p>
        <ul>
            <li><strong>text/html</strong> : Retourne une représentation HTML des données</li>
            <li><strong>application/ld+json</strong> : Retourne les données au format JSON-LD (web sémantique)</li>
        </ul>

        <h2>🛣️ Routes disponibles</h2>
        <p style="background-color: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 15px 0;">
            <strong>⚠️ Note importante pour PowerShell :</strong> Sur Windows PowerShell, utilisez <code>curl.exe</code> au lieu de <code>curl</code>, ou utilisez <code>Invoke-RestMethod</code> (voir exemples ci-dessous).
        </p>

        <div class="route">
            <span class="method">GET</span>
            <code>/data</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Page d'accueil de l'API (cette page) ou document JSON-LD complet avec tous les restaurants, menus et commandes.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/restaurants</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Liste de tous les restaurants. Format HTML : tableau des restaurants. Format JSON-LD : collection de restaurants.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/restaurants/:id</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Détails d'un restaurant spécifique. Format HTML : page détaillée. Format JSON-LD : document JSON-LD du restaurant.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants/:id</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/restaurants/:id/menu</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Liste des items de menu pour un restaurant spécifique. Format HTML : tableau des items. Format JSON-LD : collection d'items de menu.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants/:id/menu</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/menus</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Liste de tous les items de menu. Format HTML : tableau des items. Format JSON-LD : collection d'items de menu.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/menus</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/menus/:id</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Détails d'un item de menu spécifique. Format HTML : page détaillée. Format JSON-LD : document JSON-LD de l'item.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/menus/:id</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/orders</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Liste de toutes les commandes. Format HTML : tableau des commandes. Format JSON-LD : collection de commandes.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/orders</pre>
        </div>

        <div class="route">
            <span class="method">GET</span>
            <code>/data/orders/:id</code>
            <span class="format-badge">HTML / JSON-LD</span>
            <p>Détails d'une commande spécifique. Format HTML : page détaillée. Format JSON-LD : document JSON-LD de la commande.</p>
            <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/orders/:id</pre>
        </div>

        <h2>📊 Format JSON-LD</h2>
        <p>Les données sont modélisées selon le vocabulaire <a href="https://schema.org/" target="_blank">Schema.org</a> :</p>
        <ul>
            <li><strong>Restaurant</strong> : Informations sur les restaurants</li>
            <li><strong>MenuItem</strong> : Items de menu des restaurants</li>
            <li><strong>Order</strong> : Commandes des clients</li>
            <li><strong>PostalAddress</strong> : Adresses des restaurants et de livraison</li>
            <li><strong>OpeningHoursSpecification</strong> : Heures d'ouverture</li>
            <li><strong>Review</strong> : Avis des clients</li>
            <li><strong>AggregateRating</strong> : Note moyenne</li>
        </ul>

        <h2>🔗 Liens utiles</h2>
        <ul>
            <li><a href="${BASE_URL}/data/restaurants">Voir tous les restaurants</a></li>
            <li><a href="${BASE_URL}/data/menus">Voir tous les items de menu</a></li>
            <li><a href="${BASE_URL}/data/orders">Voir toutes les commandes</a></li>
        </ul>

        <h2>💡 Exemple d'utilisation</h2>
        <p>Pour obtenir les données au format JSON-LD, ajoutez l'en-tête suivant à votre requête :</p>
        <pre>Accept: application/ld+json</pre>
        <p><strong>Utilisation avec curl :</strong></p>
        <p>Dans un terminal (PowerShell sur Windows, Terminal sur Mac/Linux) :</p>
        <pre>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants</pre>
        <p><strong>Note :</strong> Sur Windows PowerShell, utilisez <code>curl.exe</code> au lieu de <code>curl</code>.</p>
        <p><strong>Alternative PowerShell :</strong></p>
        <pre>$headers = @{ "Accept" = "application/ld+json" }
Invoke-RestMethod -Uri "${BASE_URL}/data/restaurants" -Method GET -Headers $headers</pre>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Liste de tous les restaurants
 * Retourne soit un tableau HTML, soit une collection JSON-LD
 */
export const getRestaurantsList = async (req, res, next) => {
    try {
        const format = req.requestedFormat || 'html';

        // Récupérer tous les restaurants
        const restaurants = await Restaurant.find()
            .populate('reviews.user', 'name email')
            .lean();

        if (format === 'jsonld') {
            // Générer le JSON-LD avec validation optionnelle
            const jsonLd = await restaurantsToJsonLd(restaurants, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Tableau des restaurants
        const restaurantsHtml = restaurants.map(restaurant => {
            const restaurantId = restaurant.id?.toString() || restaurant._id?.toString();
            const rating = restaurant.rating || 0;
            const reviewCount = restaurant.reviews?.length || 0;
            const cuisine = restaurant.cuisine || 'Non spécifié';
            const phone = restaurant.phone || 'Non renseigné';

            return `
                <tr>
                    <td><a href="${BASE_URL}/data/restaurants/${restaurantId}">${restaurant.name}</a></td>
                    <td>${restaurant.address}</td>
                    <td>${cuisine}</td>
                    <td>${phone}</td>
                    <td>${rating > 0 ? `★ ${rating.toFixed(1)} (${reviewCount} avis)` : 'Pas encore noté'}</td>
                </tr>
            `;
        }).join('');

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurants - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
        .jsonld-link {
            float: right;
            color: #2196F3;
            text-decoration: none;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data" class="back-link">← Retour à l'accueil</a>
        <h1>🍽️ Liste des Restaurants</h1>
        <p>Total : <strong>${restaurants.length}</strong> restaurant(s)</p>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir cette liste en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants</code>
        </p>
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Adresse</th>
                    <th>Type de cuisine</th>
                    <th>Téléphone</th>
                    <th>Note</th>
                </tr>
            </thead>
            <tbody>
                ${restaurantsHtml || '<tr><td colspan="5" style="text-align: center;">Aucun restaurant disponible</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Détails d'un restaurant spécifique
 * Retourne soit une page HTML détaillée, soit un document JSON-LD
 */
export const getRestaurantDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const format = req.requestedFormat || 'html';

        const restaurant = await Restaurant.findById(id)
            .populate('reviews.user', 'name email')
            .lean();

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        if (format === 'jsonld') {
            // Générer le JSON-LD avec validation optionnelle
            const jsonLd = await restaurantToJsonLd(restaurant, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Page détaillée du restaurant
        const restaurantId = restaurant.id?.toString() || restaurant._id?.toString();
        const rating = restaurant.rating || 0;
        const reviewCount = restaurant.reviews?.length || 0;
        const cuisine = restaurant.cuisine || 'Non spécifié';
        const phone = restaurant.phone || 'Non renseigné';

        // Générer les heures d'ouverture
        let openingHoursHtml = '<p>Aucune information disponible</p>';
        if (restaurant.openingHours && restaurant.openingHours.length > 0) {
            openingHoursHtml = '<ul>';
            restaurant.openingHours.forEach(oh => {
                openingHoursHtml += `<li><strong>${oh.day}</strong> : ${oh.open} - ${oh.close}</li>`;
            });
            openingHoursHtml += '</ul>';
        }

        // Générer les avis
        let reviewsHtml = '<p>Aucun avis pour le moment</p>';
        if (restaurant.reviews && restaurant.reviews.length > 0) {
            reviewsHtml = '<div style="margin-top: 20px;">';
            restaurant.reviews.forEach(review => {
                const userName = review.user?.name || 'Utilisateur anonyme';
                const comment = review.comment || 'Aucun commentaire';
                const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : '';
                reviewsHtml += `
                    <div style="border-left: 3px solid #4CAF50; padding-left: 15px; margin-bottom: 15px;">
                        <p><strong>${userName}</strong> - ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} (${review.rating}/5)</p>
                        <p>${comment}</p>
                        ${reviewDate ? `<p style="color: #666; font-size: 0.9em;">${reviewDate}</p>` : ''}
                    </div>
                `;
            });
            reviewsHtml += '</div>';
        }

        // Lien vers le menu (mentionné mais pas implémenté)
        const menuLink = restaurant.menu && restaurant.menu.length > 0 
            ? `<p><a href="${BASE_URL}/data/restaurants/${restaurantId}/menu">Voir le menu</a></p>`
            : '<p>Menu non disponible</p>';

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${restaurant.name} - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .info-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .info-section h2 {
            color: #555;
            margin-top: 0;
            font-size: 1.2em;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
        .rating {
            font-size: 1.2em;
            color: #FF9800;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data/restaurants" class="back-link">← Retour à la liste</a>
        <h1>${restaurant.name}</h1>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir ces données en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants/${restaurantId}</code>
        </p>
        
        <div class="info-section">
            <h2>📍 Adresse</h2>
            <p>${restaurant.address}</p>
        </div>

        <div class="info-section">
            <h2>📞 Contact</h2>
            <p>Téléphone : ${phone}</p>
        </div>

        <div class="info-section">
            <h2>🍴 Type de cuisine</h2>
            <p>${cuisine}</p>
        </div>

        <div class="info-section">
            <h2>⭐ Note</h2>
            <p class="rating">${rating > 0 ? `★ ${rating.toFixed(1)} / 5.0 (${reviewCount} avis)` : 'Pas encore noté'}</p>
        </div>

        <div class="info-section">
            <h2>🕐 Heures d'ouverture</h2>
            ${openingHoursHtml}
        </div>

        <div class="info-section">
            <h2>📋 Menu</h2>
            ${menuLink}
        </div>

        <div class="info-section">
            <h2>💬 Avis clients</h2>
            ${reviewsHtml}
        </div>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Menu d'un restaurant spécifique
 * Retourne soit un tableau HTML, soit une collection JSON-LD
 */
export const getRestaurantMenu = async (req, res, next) => {
    try {
        const { id } = req.params;
        const format = req.requestedFormat || 'html';

        // Vérifier que le restaurant existe
        const restaurant = await Restaurant.findById(id).lean();
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Récupérer les items de menu du restaurant
        const menuItems = await Menu.find({ restaurant: id })
            .populate('restaurant', 'name')
            .lean();

        if (format === 'jsonld') {
            const jsonLd = await menuItemsToJsonLd(menuItems, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Tableau des items de menu du restaurant
        const restaurantId = restaurant.id?.toString() || restaurant._id?.toString();
        const menuItemsHtml = menuItems.map(item => {
            const itemId = item.id?.toString() || item._id?.toString();

            return `
                <tr>
                    <td><a href="${BASE_URL}/data/menus/${itemId}">${item.name}</a></td>
                    <td>${item.description || 'Aucune description'}</td>
                    <td>${item.category || 'Autre'}</td>
                    <td>$${item.price?.toFixed(2) || '0.00'}</td>
                </tr>
            `;
        }).join('');

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu - ${restaurant.name} - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data/restaurants/${restaurantId}" class="back-link">← Retour au restaurant</a>
        <h1>🍽️ Menu - ${restaurant.name}</h1>
        <p>Total : <strong>${menuItems.length}</strong> item(s)</p>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir ce menu en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/restaurants/${restaurantId}/menu</code>
        </p>
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                </tr>
            </thead>
            <tbody>
                ${menuItemsHtml || '<tr><td colspan="4" style="text-align: center;">Aucun item de menu disponible pour ce restaurant</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Liste de tous les items de menu
 * Retourne soit un tableau HTML, soit une collection JSON-LD
 */
export const getMenuItemsList = async (req, res, next) => {
    try {
        const format = req.requestedFormat || 'html';

        // Récupérer tous les items de menu
        const menuItems = await Menu.find()
            .populate('restaurant', 'name')
            .lean();

        if (format === 'jsonld') {
            const jsonLd = await menuItemsToJsonLd(menuItems, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Tableau des items de menu
        const menuItemsHtml = menuItems.map(item => {
            const itemId = item.id?.toString() || item._id?.toString();
            const restaurantName = item.restaurant?.name || 'Restaurant inconnu';
            const restaurantId = typeof item.restaurant === 'object' 
                ? (item.restaurant._id || item.restaurant.id)?.toString()
                : item.restaurant?.toString();

            return `
                <tr>
                    <td><a href="${BASE_URL}/data/menus/${itemId}">${item.name}</a></td>
                    <td>${item.description || 'Aucune description'}</td>
                    <td>${item.category || 'Autre'}</td>
                    <td>$${item.price?.toFixed(2) || '0.00'}</td>
                    <td>${restaurantId ? `<a href="${BASE_URL}/data/restaurants/${restaurantId}">${restaurantName}</a>` : restaurantName}</td>
                </tr>
            `;
        }).join('');

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu Items - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data" class="back-link">← Retour à l'accueil</a>
        <h1>🍽️ Liste des Items de Menu</h1>
        <p>Total : <strong>${menuItems.length}</strong> item(s)</p>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir cette liste en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/menus</code>
        </p>
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Restaurant</th>
                </tr>
            </thead>
            <tbody>
                ${menuItemsHtml || '<tr><td colspan="5" style="text-align: center;">Aucun item de menu disponible</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Détails d'un item de menu spécifique
 * Retourne soit une page HTML détaillée, soit un document JSON-LD
 */
export const getMenuItemDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const format = req.requestedFormat || 'html';

        const menuItem = await Menu.findById(id)
            .populate('restaurant', 'name address')
            .lean();

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        if (format === 'jsonld') {
            const jsonLd = await menuItemToJsonLd(menuItem, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Page détaillée de l'item
        const itemId = menuItem.id?.toString() || menuItem._id?.toString();
        const restaurant = menuItem.restaurant;
        const restaurantId = typeof restaurant === 'object' 
            ? (restaurant._id || restaurant.id)?.toString()
            : restaurant?.toString();

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${menuItem.name} - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .info-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .info-section h2 {
            color: #555;
            margin-top: 0;
            font-size: 1.2em;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
        .price {
            font-size: 1.5em;
            color: #4CAF50;
            font-weight: bold;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data/menus" class="back-link">← Retour à la liste</a>
        <h1>${menuItem.name}</h1>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir ces données en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/menus/${itemId}</code>
        </p>
        
        <div class="info-section">
            <h2>💰 Prix</h2>
            <p class="price">$${menuItem.price?.toFixed(2) || '0.00'}</p>
        </div>

        <div class="info-section">
            <h2>📝 Description</h2>
            <p>${menuItem.description || 'Aucune description disponible'}</p>
        </div>

        <div class="info-section">
            <h2>🏷️ Catégorie</h2>
            <p>${menuItem.category || 'Autre'}</p>
        </div>

        ${menuItem.image ? `
        <div class="info-section">
            <h2>🖼️ Image</h2>
            <img src="${menuItem.image}" alt="${menuItem.name}" />
        </div>
        ` : ''}

        <div class="info-section">
            <h2>🏪 Restaurant</h2>
            ${restaurantId ? `<p><a href="${BASE_URL}/data/restaurants/${restaurantId}">${restaurant?.name || 'Restaurant'}</a></p>` : '<p>Restaurant non disponible</p>'}
            ${restaurant?.address ? `<p>${restaurant.address}</p>` : ''}
        </div>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Liste de toutes les commandes
 * Retourne soit un tableau HTML, soit une collection JSON-LD
 */
export const getOrdersList = async (req, res, next) => {
    try {
        const format = req.requestedFormat || 'html';

        // Récupérer toutes les commandes
        const orders = await Order.find()
            .populate('restaurant', 'name')
            .populate('user', 'name email')
            .populate('items.menuItem', 'name')
            .lean();

        if (format === 'jsonld') {
            const jsonLd = await ordersToJsonLd(orders, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Tableau des commandes
        const ordersHtml = orders.map(order => {
            const orderId = order.id?.toString() || order._id?.toString();
            const restaurantName = order.restaurant?.name || 'Restaurant inconnu';
            const userName = typeof order.user === 'object' ? order.user.name : 'Utilisateur inconnu';
            const status = order.status || 'En attente';
            const itemCount = order.items?.length || 0;

            return `
                <tr>
                    <td><a href="${BASE_URL}/data/orders/${orderId}">Commande #${orderId.substring(0, 8)}</a></td>
                    <td>${userName}</td>
                    <td>${restaurantName}</td>
                    <td>${itemCount} item(s)</td>
                    <td>$${order.totalPrice?.toFixed(2) || '0.00'}</td>
                    <td>${status}</td>
                    <td>${order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</td>
                </tr>
            `;
        }).join('');

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commandes - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data" class="back-link">← Retour à l'accueil</a>
        <h1>📦 Liste des Commandes</h1>
        <p>Total : <strong>${orders.length}</strong> commande(s)</p>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir cette liste en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/orders</code>
        </p>
        <table>
            <thead>
                <tr>
                    <th>ID Commande</th>
                    <th>Client</th>
                    <th>Restaurant</th>
                    <th>Items</th>
                    <th>Prix Total</th>
                    <th>Statut</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${ordersHtml || '<tr><td colspan="7" style="text-align: center;">Aucune commande disponible</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

/**
 * Détails d'une commande spécifique
 * Retourne soit une page HTML détaillée, soit un document JSON-LD
 */
export const getOrderDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const format = req.requestedFormat || 'html';

        const order = await Order.findById(id)
            .populate('restaurant', 'name address cuisine phone')
            .populate('user', 'name email phone')
            .populate('items.menuItem', 'name description price')
            .populate({
                path: 'deliveryPartner',
                populate: { path: 'user', select: 'name email phone' }
            })
            .lean();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (format === 'jsonld') {
            const jsonLd = await orderToJsonLd(order, BASE_URL, false);
            res.setHeader('Content-Type', 'application/ld+json');
            return res.status(200).json(jsonLd);
        }

        // Format HTML - Page détaillée de la commande
        const orderId = order.id?.toString() || order._id?.toString();
        const restaurant = order.restaurant;
        const user = typeof order.user === 'object' ? order.user : null;
        const restaurantId = typeof restaurant === 'object' 
            ? (restaurant._id || restaurant.id)?.toString()
            : restaurant?.toString();

        // Générer les items
        let itemsHtml = '<ul>';
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                itemsHtml += `
                    <li>
                        <strong>${item.name}</strong> - 
                        Quantité: ${item.quantity} - 
                        Prix unitaire: $${item.unitPrice?.toFixed(2) || '0.00'} - 
                        Total: $${item.total?.toFixed(2) || '0.00'}
                        ${item.notes ? `<br><em>Notes: ${item.notes}</em>` : ''}
                    </li>
                `;
            });
        }
        itemsHtml += '</ul>';

        // Adresse de livraison
        const deliveryAddress = order.deliveryAddress;
        const addressHtml = deliveryAddress 
            ? `${deliveryAddress.line1}${deliveryAddress.line2 ? ', ' + deliveryAddress.line2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.region} ${deliveryAddress.postalCode}, ${deliveryAddress.country}`
            : 'Non disponible';

        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commande #${orderId.substring(0, 8)} - FoufouFood</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .info-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .info-section h2 {
            color: #555;
            margin-top: 0;
            font-size: 1.2em;
        }
        a {
            color: #4CAF50;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #666;
            text-decoration: none;
        }
        .back-link:hover {
            color: #4CAF50;
        }
        .total-price {
            font-size: 1.5em;
            color: #4CAF50;
            font-weight: bold;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            background-color: #FF9800;
            color: white;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${BASE_URL}/data/orders" class="back-link">← Retour à la liste</a>
        <h1>📦 Commande #${orderId.substring(0, 8)}</h1>
        <p style="background-color: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <strong>💡 Pour obtenir ces données en JSON-LD :</strong><br>
            <code>curl.exe -H "Accept: application/ld+json" ${BASE_URL}/data/orders/${orderId}</code>
        </p>
        
        <div class="info-section">
            <h2>📊 Statut</h2>
            <span class="status">${order.status || 'En attente'}</span>
        </div>

        <div class="info-section">
            <h2>👤 Client</h2>
            <p><strong>${user?.name || 'Client inconnu'}</strong></p>
            ${user?.email ? `<p>Email: ${user.email}</p>` : ''}
            ${user?.phone ? `<p>Téléphone: ${user.phone}</p>` : ''}
        </div>

        <div class="info-section">
            <h2>🏪 Restaurant</h2>
            ${restaurantId ? `<p><a href="${BASE_URL}/data/restaurants/${restaurantId}"><strong>${restaurant?.name || 'Restaurant'}</strong></a></p>` : '<p>Restaurant non disponible</p>'}
            ${restaurant?.address ? `<p>${restaurant.address}</p>` : ''}
        </div>

        <div class="info-section">
            <h2>🛒 Items commandés</h2>
            ${itemsHtml}
        </div>

        <div class="info-section">
            <h2>💰 Prix Total</h2>
            <p class="total-price">$${order.totalPrice?.toFixed(2) || '0.00'}</p>
        </div>

        <div class="info-section">
            <h2>📍 Adresse de livraison</h2>
            <p>${addressHtml}</p>
        </div>

        ${order.createdAt ? `
        <div class="info-section">
            <h2>📅 Date de commande</h2>
            <p>${new Date(order.createdAt).toLocaleString('fr-FR')}</p>
        </div>
        ` : ''}
    </div>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

