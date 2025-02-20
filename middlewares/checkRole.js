const { pool } = require("../config/database");

// Middleware pour vérifier le rôle d'un utilisateur
const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Récupérer le rôle de l'utilisateur depuis la base de données
            const result = await pool.query(
                "SELECT r.level FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(403).json({ error: "Utilisateur non trouvé" });
            }

            const userLevel = result.rows[0].level;

            // Récupérer le niveau du rôle requis
            const roleResult = await pool.query(
                "SELECT level FROM roles WHERE alias = $1",
                [requiredRole]
            );

            if (roleResult.rows.length === 0) {
                return res.status(500).json({ error: "Rôle non trouvé" });
            }

            const requiredLevel = roleResult.rows[0].level;

            // Vérification des permissions
            if (userLevel < requiredLevel) {
                return res.status(403).json({ error: "Accès refusé. Rôle insuffisant." });
            }

            next(); // Laisser passer si le rôle est suffisant
        } catch (err) {
            console.error("❌ Erreur dans checkRole :", err.message);
            res.status(500).json({ error: "Erreur interne du serveur" });
        }
    };
};

module.exports = checkRole;