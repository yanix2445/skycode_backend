const checkRole = (requiredRole) => {
    return (req, res, next) => {
        console.log(`🔍 Vérification du rôle - Utilisateur: ${req.user.id}, Role ID: ${req.user.role_id}, Required: ${requiredRole}`);

        if (!req.user || !req.user.role_id) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        // ✅ Seuls les rôles inférieurs ou égaux au rôle requis sont acceptés
        if (req.user.role_id > requiredRole) {
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        next();
    };
};

module.exports = checkRole;