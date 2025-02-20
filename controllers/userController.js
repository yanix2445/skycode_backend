const { pool } = require("../config/database");

// ✅ Récupérer tous les utilisateurs avec pagination et filtre par rôle
const getAllUsers = async (req, res) => {
  try {
      let { role, page = 1, limit = 10 } = req.query;

      page = parseInt(page, 10) || 1;  
      limit = parseInt(limit, 10) || 10;
      const offset = (page - 1) * limit;

      console.log(`🔍 Récupération des utilisateurs - Page: ${page}, Limit: ${limit}, Rôle: ${role || "tous"}`);

      let query = "SELECT id, name, email, role FROM users";
      let queryParams = [];
      let paramIndex = 1;

      if (role) {
          query += ` WHERE role = $${paramIndex}`;
          queryParams.push(role);
          paramIndex++;
      }

      query += ` ORDER BY id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);

      console.log(`📌 Requête SQL exécutée: ${query} avec paramètres ${queryParams}`);

      const result = await pool.query(query, queryParams);

      // ✅ Vérification du nombre total d'utilisateurs
      let countQuery = "SELECT COUNT(*) FROM users";
      let countParams = [];
      let countParamIndex = 1;

      if (role) {
          countQuery += ` WHERE role = $${countParamIndex}`;
          countParams.push(role);
      }

      const totalCount = await pool.query(countQuery, countParams);
      const totalUsers = parseInt(totalCount.rows[0].count, 10);
      const totalPages = Math.ceil(totalUsers / limit);

      res.json({
          totalUsers,
          totalPages,
          currentPage: page,
          perPage: limit,
          users: result.rows,
      });
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

        const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [id]);

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
      const { name, email, role } = req.body;

      console.log(`✏️ Mise à jour de l'utilisateur ID: ${id}`);

      // Vérifier si l'utilisateur existe
      const checkUser = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (checkUser.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      // Construction dynamique de la requête
      let updateFields = [];
      let queryParams = [];
      let paramIndex = 1;

      if (name) {
          updateFields.push(`name = $${paramIndex}`);
          queryParams.push(name);
          paramIndex++;
      }
      if (email) {
          updateFields.push(`email = $${paramIndex}`);
          queryParams.push(email);
          paramIndex++;
      }
      if (role) {
          updateFields.push(`role = $${paramIndex}`);
          queryParams.push(role);
          paramIndex++;
      }

      if (updateFields.length === 0) {
          return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
      }

      queryParams.push(id);
      const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, email, role`;

      const updatedUser = await pool.query(updateQuery, queryParams);

      console.log(`✅ Utilisateur ID: ${id} mis à jour avec succès`);

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

        console.log(`🗑️ Suppression de l'utilisateur ID: ${id}`);

        // Vérifier si l'utilisateur existe
        const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        console.log(`✅ Utilisateur ID: ${id} supprimé avec succès`);

        res.json({ message: "Utilisateur supprimé avec succès" });

    } catch (err) {
        console.error("❌ Erreur lors de la suppression de l'utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };