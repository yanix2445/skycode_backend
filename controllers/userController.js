const { pool } = require("../config/database");

// ✅ Récupérer tous les utilisateurs (Admins et Managers)
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, email, role FROM users");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Récupérer un utilisateur par ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Mettre à jour un utilisateur (Admin uniquement)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role } = req.body;

        const updatedUser = await pool.query(
            "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role) WHERE id = $4 RETURNING id, name, email, role",
            [name, email, role, id]
        );

        res.json({ message: "Utilisateur mis à jour avec succès", user: updatedUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Supprimer un utilisateur (Admin uniquement)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };