const { pool } = require("../config/database");

const assignRole = async (req, res) => {
    try {
        const { userId, newRoleAlias } = req.body;
        const requesterId = req.user.id;

        // Vérifier le rôle actuel du demandeur
        const requesterRole = await pool.query(
            "SELECT r.level FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1",
            [requesterId]
        );

        if (requesterRole.rows.length === 0) {
            return res.status(403).json({ error: "Demandeur non trouvé" });
        }

        const requesterLevel = requesterRole.rows[0].level;

        // Vérifier le niveau du rôle à attribuer
        const newRole = await pool.query("SELECT id, level FROM roles WHERE alias = $1", [newRoleAlias]);

        if (newRole.rows.length === 0) {
            return res.status(400).json({ error: "Rôle invalide" });
        }

        const newRoleId = newRole.rows[0].id;
        const newRoleLevel = newRole.rows[0].level;

        // Vérification : un admin ne peut attribuer que des rôles inférieurs à son niveau
        if (requesterLevel <= newRoleLevel) {
            return res.status(403).json({ error: "Vous ne pouvez pas attribuer ce rôle" });
        }

        // Mettre à jour le rôle de l'utilisateur cible
        await pool.query("UPDATE users SET role_id = $1 WHERE id = $2", [newRoleId, userId]);

        res.json({ message: "Rôle mis à jour avec succès" });
    } catch (err) {
        console.error("❌ Erreur lors de l'attribution du rôle :", err.message);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
};

module.exports = { assignRole };