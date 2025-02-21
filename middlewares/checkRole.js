const checkRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role_id) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        // 🔍 Vérifier que le rôle de l'utilisateur est supérieur ou égal au rôle requis
        if (req.user.role_id > requiredRole) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        next();
    };
};

module.exports = checkRole;