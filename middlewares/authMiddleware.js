const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    console.log("🔍 AuthHeader reçu :", authHeader);

    if (!authHeader) {
        console.log("🚨 Aucun token fourni !");
        return res.status(401).json({ error: "Accès refusé : Aucun token fourni." });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token extrait :", token);

    if (!token) {
        console.log("🚨 Aucun token après 'Bearer' !");
        return res.status(401).json({ error: "Accès refusé : Token invalide." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("🚨 JWT invalide ! Erreur :", err.message);
            return res.status(403).json({ error: "Accès refusé : Token invalide." });
        }

        console.log(`✅ JWT validé ! Utilisateur ID: ${user.id}`);
        req.user = user;  // 📌 On attache l'utilisateur au `req`
        next();
    });
};


module.exports = { authenticateToken };