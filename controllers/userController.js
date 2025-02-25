const { pool } = require("../config/database");

// ✅ Récupérer tous les utilisateurs 
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.role_id, 
                   r.alias AS role_alias, r.name AS role_name, r.level
            FROM users u
            JOIN roles r ON u.role_id = r.id
        `);

        res.json(result.rows);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Récupérer un utilisateur par ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🔍 Recherche de l'utilisateur ID: ${id}`);

        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.role_id, 
                   r.alias AS role_alias, r.name AS role_name, r.level
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("❌ Erreur lors de la récupération de l'utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Mettre à jour un utilisateur (Admin uniquement)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role_id } = req.body;
        const requesterRole = req.user.role_id; // Récupère le rôle de celui qui fait la requête

        console.log(`🛠️ Mise à jour de l'utilisateur ${id} par ${req.user.id} (Rôle: ${requesterRole})`);

        // Vérifier si l'utilisateur existe
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        // Vérifier si on essaie de modifier le rôle
        if (role_id !== undefined) {
            console.log(`🔍 Tentative d'attribution du rôle ${role_id} à ${id}`);

            // Vérifie si le rôle demandé existe
            const roleCheck = await pool.query("SELECT * FROM roles WHERE id = $1", [role_id]);
            if (roleCheck.rows.length === 0) {
                return res.status(400).json({ error: "Le rôle spécifié n'existe pas." });
            }

            // Vérifie si le demandeur a le droit d'attribuer ce rôle
            if (requesterRole > 2) {
                return res.status(403).json({ error: "Accès refusé. Seuls les Admins et Super Admins peuvent attribuer des rôles." });
            }
            if (requesterRole >= role_id) {
                return res.status(403).json({ error: "Accès refusé. Vous ne pouvez pas attribuer un rôle égal ou supérieur au vôtre." });
            }
        }

        // Mise à jour des informations
        const updatedUser = await pool.query(
            "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role_id = COALESCE($3, role_id) WHERE id = $4 RETURNING id, name, email, role_id",
            [name, email, role_id, id]
        );

        console.log(`✅ Mise à jour réussie pour l'utilisateur ${id}`);

        res.json({ message: "Utilisateur mis à jour avec succès", user: updatedUser.rows[0] });

    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de l'utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Supprimer un utilisateur (Admin uniquement)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si l'utilisateur existe
        const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        // Vérifier que l'utilisateur connecté a bien les droits pour supprimer
        if (req.user.role_id < 6) { // Seul un rôle admin (6) ou super admin (7) peut supprimer
            return res.status(403).json({ error: "Accès refusé. Permission insuffisante." });
        }

        // Supprimer l'utilisateur
        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (err) {
        console.error("❌ Erreur lors de la suppression de l'utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
};



module.exports = { getAllUsers, getUserById, updateUser, deleteUser };