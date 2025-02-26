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
    const { id } = req.params;
    const userResult = await pool.query("SELECT id, name, email, role_id FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    return res.json(userResult.rows[0]);
};

// ✅ Modifier un utilisateur (seulement accessible par admin et super_admin)


const updateUser = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'utilisateur ciblé
        const { name, email, password } = req.body;
        const requesterId = req.user.id; // ID de l'utilisateur effectuant la requête
        const requesterRole = req.user.role_id; // Rôle de l'utilisateur effectuant la requête

        console.log("=====================================");
        console.log(`🔍 [DEBUT] Tentative de modification de l'utilisateur ${id} par ${requesterId}`);
        console.log(`📌 Rôle de l'utilisateur effectuant la requête: ${requesterRole}`);
        console.log(`📌 ID de l'utilisateur effectuant la requête: ${requesterId}`);
        console.log(`📌 ID de l'utilisateur ciblé: ${id}`);
        console.log(`📌 Données envoyées:`, req.body);
        console.log("=====================================");

        // Vérifier si l'utilisateur ciblé existe
        const userResult = await pool.query("SELECT id, role_id FROM users WHERE id = $1", [id]);
        if (userResult.rows.length === 0) {
            console.log("⛔ [ERREUR] Utilisateur introuvable !");
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        const targetUser = userResult.rows[0];
        console.log(`📌 L'utilisateur ciblé a le rôle: ${targetUser.role_id}`);

        // 🚨 Vérifier que l'utilisateur ne tente pas de modifier un autre profil (sauf Super Admin)
        if (requesterId !== targetUser.id) {
            console.log("⛔ [ERREUR] Un utilisateur ne peut modifier que son propre profil !");
            return res.status(403).json({ error: "Vous ne pouvez modifier que votre propre profil." });
        }

        console.log("✅ [CHECK] L'utilisateur a bien le droit de modifier son profil.");

        let updatedFields = [];
        let updatedValues = [];
        let index = 1;

        if (name) {
            updatedFields.push(`name = $${index}`);
            updatedValues.push(name);
            index++;
        }

        if (email) {
            updatedFields.push(`email = $${index}`);
            updatedValues.push(email);
            index++;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedFields.push(`password = $${index}`);
            updatedValues.push(hashedPassword);
            index++;
        }

        if (updatedFields.length === 0) {
            console.log("⛔ [ERREUR] Aucune donnée valide à mettre à jour !");
            return res.status(400).json({ error: "Aucune donnée à mettre à jour." });
        }

        updatedValues.push(id);

        // ✅ **Exécution de la requête SQL**
        const query = `UPDATE users SET ${updatedFields.join(", ")} WHERE id = $${index} RETURNING id, name, email, role_id`;
        const updatedUser = await pool.query(query, updatedValues);

        console.log("✅ [SUCCÈS] Mise à jour réussie !");
        console.log("🔍 [RÉSULTAT] Données mises à jour :", updatedUser.rows[0]);

        return res.json({
            message: "Utilisateur mis à jour avec succès",
            user: updatedUser.rows[0]
        });

    } catch (err) {
        console.error("❌ [ERREUR CRITIQUE] Erreur lors de la mise à jour de l'utilisateur :", err);
        return res.status(500).json({ error: "Erreur serveur lors de la mise à jour de l'utilisateur." });
    }
};






const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // ID de l'utilisateur à supprimer
        const requesterId = req.user.id; // ID de celui qui fait la requête
        const requesterRoleId = req.user.role_id; // Rôle de celui qui fait la requête

        console.log(
            `🗑️ Tentative de suppression de l'ID: ${id} par l'ID: ${requesterId} (Role: ${requesterRoleId})`
        );

        // Vérifier si l'utilisateur cible existe
        const userResult = await pool.query(
            "SELECT id, role_id FROM users WHERE id = $1",
            [id]
        );

        if (userResult.rows.length === 0) {
            console.log("❌ Utilisateur introuvable.");
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        const targetUser = userResult.rows[0];
        const targetRoleId = targetUser.role_id;

        console.log(
            `🎯 Utilisateur cible - ID: ${targetUser.id}, Role: ${targetRoleId}`
        );
        console.log(
            `🔎 Admin exécutant - ID: ${requesterId}, Role: ${requesterRoleId}`
        );

        // 🚨 Vérification des permissions
        if (requesterId === targetUser.id) {
            console.log("⛔ Tentative de suppression de son propre compte !");
            return res
                .status(403)
                .json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
        }
        // 🚨 Empêcher un Super Admin de supprimer son propre compte
        if (requesterId === targetUser.id && requesterRoleId === 1) {
            console.log(
                "🚨 Un Super Admin ne peut pas supprimer son propre compte !"
            );
            return res.status(403).json({
                error: "Vous ne pouvez pas supprimer votre propre compte Super Admin.",
            });
        }
        
        if (requesterRoleId === 1 && targetRoleId === 1) {
            // Super Admin vs Super Admin
            console.log(
                "⛔ Un Super Admin ne peut pas supprimer un autre Super Admin !"
            );
            return res.status(403).json({
                error: "Un Super Admin ne peut pas supprimer un autre Super Admin.",
            });
        }

        if (requesterRoleId === 2) {
            // Admin
            if (targetRoleId <= 2) {
                // Un Admin ne peut pas supprimer un autre Admin ou un Super Admin
                console.log(
                    "⛔ Un Admin ne peut supprimer que des utilisateurs de niveau inférieur !"
                );
                return res.status(403).json({
                    error:
                        "Un Admin ne peut supprimer que des utilisateurs de niveau inférieur.",
                });
            }
            console.log("✅ Admin peut supprimer cet utilisateur !");
        } else if (requesterRoleId !== 1) {
            // Seuls les Admins et Super Admins peuvent supprimer
            console.log("❌ Accès refusé - Rôle insuffisant.");
            return res.status(403).json({
                error:
                    "Accès refusé. Seuls les Admins et Super Admins peuvent supprimer un utilisateur.",
            });
        }

        // ✅ Supprimer tous les refreshTokens associés à l'utilisateur supprimé
        console.log(
            "🗑️ Suppression des refreshTokens associés à cet utilisateur..."
        );
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [id]);

        // ✅ Suppression de l'utilisateur
        console.log("🚀 Suppression de l'utilisateur en base...");
        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        console.log("✅ Utilisateur supprimé avec succès !");
        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (err) {
        console.error("❌ Erreur lors de la suppression :", err);
        res.status(500).json({
            error: "Erreur serveur lors de la suppression de l'utilisateur.",
        });
    }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
