const checkRole = (...allowedRoleIds) => {
  return (req, res, next) => {
    console.log("🔍 DEBUG - Vérification du rôle");
    console.log("   📌 Utilisateur ID:", req.user.id);
    console.log("   📌 Email:", req.user.email);
    console.log("   📌 Role ID:", req.user.role_id);
    console.log("   📌 Role Name:", req.user.role_name);
    console.log("   📌 Rôles Autorisés (IDs) :", allowedRoleIds);

    if (!req.user || !req.user.role_id) {
      console.log("❌ Accès refusé - Aucun rôle attribué");
      return res
        .status(403)
        .json({ error: "Accès refusé. Aucun rôle attribué." });
    }

    // ✅ Vérification avec `role_id` au lieu de `role_name`
    if (!allowedRoleIds.includes(req.user.role_id)) {
      console.log(" Accès refusé - Permission insuffisante");
      return res
        .status(403)
        .json({ error: "Accès refusé. Permission insuffisante." });
    }

    console.log("✅ Accès autorisé !");
    next();
  };
};

module.exports = checkRole;
