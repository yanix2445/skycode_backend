const checkRole = (requiredRoleLevel) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role_id) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        if (req.user.role_id < requiredRoleLevel) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        next();
    };
};

module.exports = checkRole;