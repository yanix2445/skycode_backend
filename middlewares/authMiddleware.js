const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret";

// ✅ Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Accès refusé, token manquant" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Token invalide" });
    }
};

// ✅ Middleware de vérification des rôles
const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Accès interdit, rôle insuffisant" });
    }
    next();
};

module.exports = { authenticateToken, checkRole };