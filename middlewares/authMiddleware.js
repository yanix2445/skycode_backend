const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Ajoute les infos de l'utilisateur au `req`
        next();
    } catch (err) {
        res.status(403).json({ error: "Token invalide" });
    }
};

module.exports = { authenticateToken };