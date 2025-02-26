const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("⚠ Aucun token fourni.");
        return res.status(401).json({ error: "Token manquant." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("⚠ Token invalide ou expiré.");
            return res.status(403).json({ error: "Token invalide ou expiré." });
        }

        console.log(`✅ Token valide - Utilisateur ID: ${user.id}`);
        req.user = user;
        next();
    });
};


module.exports = { authenticateToken };