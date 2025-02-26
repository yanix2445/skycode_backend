const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        console.log("🚨 Aucun token fourni !");
        return res.status(401).json({ error: "Accès refusé : Aucun token fourni." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("🚨 JWT invalide !");
            return res.status(403).json({ error: "Accès refusé : Token invalide." });
        }

        console.log(`🔑 JWT validé ! Utilisateur ID: ${user.id}`);
        req.user = user;
        next();
    });
};


module.exports = { authenticateToken };