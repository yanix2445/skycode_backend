const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log("🔍 DEBUG - Vérification du rôle");
        console.log("   📌 Utilisateur ID:", req.user.id);
        console.log("   📌 Email:", req.user.email);
        console.log("   📌 Role ID:", req.user.role_id);
        console.log("   📌 Role Name:", req.user.role_name);
        console.log("   📌 Rôles Autorisés:", allowedRoles);

        if (!req.user || !req.user.role_id) {
            console.log("❌ Accès refusé - Aucun rôle attribué");
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        // ✅ Vérification correcte avec role_id
        if (!allowedRoles.includes(req.user.role_id)) {
            console.log("❌ Accès refusé - Permission insuffisante");
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        console.log("✅ Accès autorisé !");
        next();
    };
};

module.exports = checkRole;