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





// ✅ Modifier un utilisateur (seulement accessible par admin et super_admin)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const requesterRole = req.user.role_id; // Rôle de celui qui fait la requête

        console.log(`🔍 Tentative de modification de l'utilisateur ${id} par ${req.user.id}`);

        // Vérifier si l'utilisateur existe
        const userResult = await pool.query("SELECT id, role_id FROM users WHERE id = $1", [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        const targetUser = userResult.rows[0];

        // 🚨 Empêcher un admin de modifier un super_admin
        if (requesterRole === 2 && targetUser.role_id === 1) {
            return res.status(403).json({ error: "Un admin ne peut pas modifier un super_admin." });
        }

        // ✅ Mise à jour de l'utilisateur
        const updatedUser = await pool.query(
            "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, name, email, role_id",
            [name, email, id]
        );

        res.json({ message: "Utilisateur mis à jour avec succès", user: updatedUser.rows[0] });

    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de l'utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
};




/**
 * ✅ Supprime un utilisateur sous certaines conditions :
 * - Un `super_admin` peut supprimer n'importe qui.
 * - Un `admin` peut supprimer un utilisateur, mais seulement d'un rôle inférieur.
 * - Un utilisateur ne peut pas se supprimer lui-même.
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'utilisateur à supprimer
        const requesterId = req.user.id; // ID de celui qui fait la requête
        const requesterRoleId = req.user.role_id; // Rôle de celui qui fait la requête

        console.log(`🗑️ Tentative de suppression de l'ID: ${id} par l'ID: ${requesterId} (Role: ${requesterRoleId})`);

        // Vérifier si l'utilisateur cible existe
        const userResult = await pool.query("SELECT id, role_id FROM users WHERE id = $1", [id]);

        if (userResult.rows.length === 0) {
            console.log("❌ Utilisateur introuvable.");
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        const targetUser = userResult.rows[0];
        const targetRoleId = targetUser.role_id;

        console.log(`🎯 Utilisateur cible - ID: ${targetUser.id}, Role: ${targetRoleId}`);
        console.log(`🔎 Admin exécutant - ID: ${requesterId}, Role: ${requesterRoleId}`);

        // 🚨 Vérification des permissions
        if (requesterId === targetUser.id) {
            return res.status(403).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
        }

        if (requesterRoleId === 1) { // Super Admin
            if (targetRoleId === 1) {
                return res.status(403).json({ error: "Un Super Admin ne peut pas supprimer un autre Super Admin." });
            }
            console.log("✅ Super Admin suppression autorisée !");
        } else if (requesterRoleId === 2) { // Admin
            if (targetRoleId <= 2) { // ✅ Fix ici : Admin ne peut pas supprimer un autre Admin ou plus haut
                return res.status(403).json({ error: "Un Admin ne peut supprimer que des utilisateurs de niveau inférieur." });
            }
            console.log("✅ Admin peut supprimer cet utilisateur !");
        } else {
            console.log("❌ Accès refusé - Rôle insuffisant.");
            return res.status(403).json({ error: "Accès refusé. Seuls les Admins et Super Admins peuvent supprimer un utilisateur." });
        }

        // Suppression de l'utilisateur
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        console.log("✅ Utilisateur supprimé avec succès !");
        res.json({ message: "Utilisateur supprimé avec succès" });

    } catch (err) {
        console.error("❌ Erreur lors de la suppression :", err);
        res.status(500).json({ error: "Erreur serveur lors de la suppression de l'utilisateur." });
    }
};





module.exports = { getAllUsers, getUserById, updateUser, deleteUser };