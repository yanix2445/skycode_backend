const { pool } = require("../config/database");

const getAllRoles = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM roles ORDER BY level ASC");

        res.json({ roles: result.rows });
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des rôles :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

const assignRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;

        const result = await pool.query(
            "UPDATE users SET role_id = $1 WHERE id = $2 RETURNING id, name, email, role_id",
            [roleId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.json({ message: "Rôle mis à jour avec succès", user: result.rows[0] });
    } catch (err) {
        console.error("❌ Erreur lors de l'attribution du rôle :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// ✅ Vérifie bien que les fonctions sont exportées correctement !
module.exports = { getAllRoles, assignRole };