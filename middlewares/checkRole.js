const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRoleId = req.user.role_id; // Récupère le rôle du token JWT

        if (!userRoleId) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        if (!allowedRoles.includes(userRoleId)) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        next();
    };
};

module.exports = checkRole;