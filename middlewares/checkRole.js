const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role_alias)) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }
        next();
    };
};

module.exports = checkRole;