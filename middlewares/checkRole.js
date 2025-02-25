const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log(`🔍 Vérification du rôle - Utilisateur: ${req.user.id}, Role ID: ${req.user.role_id}, Requis: ${allowedRoles}`);

        if (!req.user || !req.user.role_id) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        next(); // ✅ L'utilisateur a le bon rôle, on continue
    };
};

module.exports = checkRole;