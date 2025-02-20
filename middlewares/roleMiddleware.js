// ✅ Middleware pour vérifier si l'utilisateur a le bon rôle
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
      if (!req.user || !req.user.role) {
          return res.status(403).json({ error: "Accès interdit, rôle non défini" });
      }

      if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ error: "Accès interdit, vous n'avez pas les permissions requises" });
      }

      next(); // ✅ L'utilisateur a le bon rôle, on continue
  };
};

module.exports = checkRole;