const { pool } = require("../config/database");

// ✅ Fonction pour attribuer un rôle à un utilisateur
const assignRole = async (req, res) => {
    try {
        const { user_id, role_id } = req.body;

        // Vérifier si l'utilisateur cible existe
        const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [user_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        // Vérifier si le rôle existe
        const roleCheck = await pool.query("SELECT * FROM roles WHERE id = $1", [role_id]);
        if (roleCheck.rows.length === 0) {
            return res.status(400).json({ error: "Rôle invalide" });
        }

        // Vérifier que l'utilisateur qui effectue la requête a un niveau suffisant
        if (req.user.role_id < 7 && req.user.role_id <= role_id) {
            return res.status(403).json({ error: "Accès refusé. Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre." });
        }

        // Mise à jour du rôle de l'utilisateur
        await pool.query("UPDATE users SET role_id = $1 WHERE id = $2", [role_id, user_id]);

        res.json({ message: "Rôle attribué avec succès" });

    } catch (err) {
        console.error("❌ Erreur lors de l'attribution du rôle :", err);
        res.status(500).json({ error: err.message });
    }
};
const { pool } = require("../config/database");

// ✅ Récupérer tous les rôles disponibles
const getRoles = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM roles ORDER BY level ASC");
        res.json(result.rows);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des rôles :", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getRoles };

module.exports = { assignRole };