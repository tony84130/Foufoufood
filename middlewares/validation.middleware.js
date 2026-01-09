/**
 * Middleware de validation pour la création de restaurant avec admin
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {void}
 */
export const validateCreateRestaurantWithAdmin = (req, res, next) => {
    const { restaurant, admin } = req.body;
    
    // Vérifier que les objets restaurant et admin existent
    if (!restaurant || !admin) {
        return res.status(400).json({
            success: false,
            message: 'Restaurant and admin data are required'
        });
    }

    // Valider les champs du restaurant
    if (!restaurant.name || typeof restaurant.name !== 'string' || restaurant.name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Restaurant name is required and must be a non-empty string'
        });
    }

    if (!restaurant.address || typeof restaurant.address !== 'string' || restaurant.address.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Restaurant address is required and must be a non-empty string'
        });
    }

    // Valider les champs de l'admin
    if (!admin.name || typeof admin.name !== 'string' || admin.name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Admin name is required and must be a non-empty string'
        });
    }

    if (!admin.email || typeof admin.email !== 'string' || admin.email.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Admin email is required and must be a valid email string'
        });
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin.email.trim())) {
        return res.status(400).json({
            success: false,
            message: 'Admin email must be a valid email format'
        });
    }

    if (!admin.password || typeof admin.password !== 'string' || admin.password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Admin password is required and must be at least 6 characters long'
        });
    }

    // Transformer et nettoyer les données pour le service
    const restaurantData = {
        restaurantName: restaurant.name.trim(),
        restaurantAddress: restaurant.address.trim(),
        adminName: admin.name.trim(),
        adminEmail: admin.email.trim(),
        adminPassword: admin.password
    };

    // Ajouter les champs optionnels du restaurant s'ils sont fournis
    if (restaurant.cuisine && typeof restaurant.cuisine === 'string' && restaurant.cuisine.trim() !== '') {
        restaurantData.restaurantCuisine = restaurant.cuisine.trim();
    }
    
    if (restaurant.phone && typeof restaurant.phone === 'string' && restaurant.phone.trim() !== '') {
        restaurantData.restaurantPhone = restaurant.phone.trim();
    }

    // Ajouter les champs optionnels de l'admin s'ils sont fournis
    if (admin.phone && typeof admin.phone === 'string' && admin.phone.trim() !== '') {
        restaurantData.adminPhone = admin.phone.trim();
    }

    // Nettoyer l'adresse de l'admin si elle est fournie
    if (admin.address && typeof admin.address === 'object') {
        const address = {};
        let hasAddress = false;

        if (admin.address.line1 && typeof admin.address.line1 === 'string' && admin.address.line1.trim() !== '') {
            address.line1 = admin.address.line1.trim();
            hasAddress = true;
        }
        if (admin.address.line2 && typeof admin.address.line2 === 'string' && admin.address.line2.trim() !== '') {
            address.line2 = admin.address.line2.trim();
            hasAddress = true;
        }
        if (admin.address.city && typeof admin.address.city === 'string' && admin.address.city.trim() !== '') {
            address.city = admin.address.city.trim();
            hasAddress = true;
        }
        if (admin.address.region && typeof admin.address.region === 'string' && admin.address.region.trim() !== '') {
            address.region = admin.address.region.trim();
            hasAddress = true;
        }
        if (admin.address.postalCode && typeof admin.address.postalCode === 'string' && admin.address.postalCode.trim() !== '') {
            address.postalCode = admin.address.postalCode.trim();
            hasAddress = true;
        }
        if (admin.address.country && typeof admin.address.country === 'string' && admin.address.country.trim() !== '') {
            address.country = admin.address.country.trim();
            hasAddress = true;
        }

        if (hasAddress) {
            restaurantData.adminAddress = address;
        }
    }

    // Ajouter les données transformées à req.body pour que le service puisse les utiliser
    req.validatedData = restaurantData;
    
    next();
};


