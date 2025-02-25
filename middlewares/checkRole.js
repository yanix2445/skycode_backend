const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log(`🔍 Vérification du rôle - Utilisateur: ${req.user.id}, Role ID: ${req.user.role_id}, Role Name: ${req.user.role_name}, Rôles Requis: ${allowedRoles}`);

        if (!req.user || !req.user.role_id) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        next();
    };
};

module.exports = checkRole;