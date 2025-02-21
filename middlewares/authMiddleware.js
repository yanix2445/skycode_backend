const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * ✅ Middleware d'authentification : Vérifie si le token JWT est valide.
 */
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;

        console.log("🛠️ Utilisateur authentifié :", req.user); // 🔥 Ajoute ça pour voir le `role_id`

        if (!req.user.role_id) {
            return res.status(403).json({ error: "Accès refusé. Aucun rôle attribué." });
        }

        next();
    } catch (err) {
        res.status(403).json({ error: "Token invalide" });
    }
};

/**
 * ✅ Middleware de rôle : Vérifie si l'utilisateur a le bon rôle pour accéder à une route.
 * @param {...string} roles Liste des rôles autorisés (ex: ["admin", "super_admin"])
 */
const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Accès interdit. Permission insuffisante." });
        }
        next();
    };
};

module.exports = { authenticateToken, checkRole };