const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * ✅ Middleware d'authentification : Vérifie si le token JWT est valide.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Token manquant." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("⚠ Token invalide ou expiré.");
            return res.status(403).json({ error: "Token invalide ou expiré." });
        }

        console.log(`🔑 Token valide pour l'utilisateur ID: ${user.id}`);
        req.user = user;
        next();
    });
};


module.exports = { authenticateToken };