require("dotenv").config();
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // 🔥 Utilisation de bcryptjs au lieu de bcrypt
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// 🛡️ Limite `/refresh` à 1 requête toutes les 10 secondes par IP
const refreshLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 secondes
    max: 1, // 1 requête max par IP
    message: { error: "Trop de requêtes, réessaie plus tard." }
});
const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret"; // 🔥 Récupère la clé depuis `.env`

console.log("🚀 Tentative de connexion à PostgreSQL...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

// Vérifier la connexion à PostgreSQL au démarrage
pool
  .connect()
  .then((client) => {
    console.log("✅ Connexion à PostgreSQL réussie !");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion à PostgreSQL :", err);
    process.exit(1); // Arrête l'application si la connexion échoue
  });

const app = express();
app.use(cors());
app.use(express.json()); // 🔥 Active le support JSON

// ✅ Route principale pour tester le serveur
app.get("/", async (req, res) => {
  console.log("✅ Requête reçue sur `/`");
  res.send("🚀 API backend en ligne !");
});

// ✅ Vérifier la connexion à la base de données
app.get("/db-test", async (req, res) => {
  try {
    console.log("🔄 Vérification de la connexion à PostgreSQL...");
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Connexion PostgreSQL OK :", result.rows[0]);
    res.json({ status: "✅ Connexion réussie", timestamp: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur de connexion :", err);
    res.status(500).json({ error: err.message });
  }
});




// ✅ Récupérer tous les utilisateurs
app.get("/users", async (req, res) => {
  try {
    console.log("🔄 Récupération des utilisateurs...");
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Récupération des utilisateurs avec pagination et filtrage
app.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
      let { role, page = 1, limit = 10 } = req.query; 

      page = parseInt(page, 10) || 1;  // Convertit en nombre entier
      limit = parseInt(limit, 10) || 10; // Définit un max par défaut

      const offset = (page - 1) * limit; // Calcule l’offset

      console.log(`🔄 Récupération des utilisateurs (Page: ${page}, Limit: ${limit}, Rôle: ${role || "tous"})`);

      // Construire la requête SQL dynamique
      let query = "SELECT id, name, email, role FROM users";
      let queryParams = [];

      if (role) {
          query += " WHERE role = $1";
          queryParams.push(role);
      }

      query += ` ORDER BY id ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);

      console.log("🔍 Requête SQL exécutée :", query, queryParams);

      const result = await pool.query(query, queryParams);

      // Compter le nombre total d'utilisateurs pour la pagination
      let countQuery = "SELECT COUNT(*) FROM users";
      let countParams = [];

      if (role) {
          countQuery += " WHERE role = $1";
          countParams.push(role);
      }

      const totalCount = await pool.query(countQuery, countParams);
      const totalUsers = parseInt(totalCount.rows[0].count, 10);

      // Calcul du nombre total de pages
      const totalPages = Math.ceil(totalUsers / limit);

      res.json({
          totalUsers,
          totalPages,
          currentPage: page,
          perPage: limit,
          users: result.rows
      });

  } catch (err) {
      console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
      res.status(500).json({ error: err.message });
  }
});

// ✅ Modifier un utilisateur
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    console.log(`🔄 Modification de l'utilisateur ${id}...`);

    const checkUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, id]
    );
    console.log("✅ Utilisateur modifié :", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erreur lors de la modification :", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Supprimer un utilisateur
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Suppression de l'utilisateur ${id}...`);

    const checkUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    console.log("✅ Utilisateur supprimé !");
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("❌ Erreur lors de la suppression :", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query("SELECT id, name, email, role FROM users");
    res.json(users.rows);
  } catch (err) {
    console.error("❌ Erreur :", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/update-profile", authenticateToken, async (req, res) => {
  try {
      const { name, email, password } = req.body;
      const userId = req.user.id; // Récupération de l'ID du user connecté

      console.log(`✏️ Mise à jour du profil pour l'utilisateur ID: ${userId}`);

      // Vérifier si l'utilisateur existe
      const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
      if (user.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      let hashedPassword = user.rows[0].password;
      if (password) {
          hashedPassword = await bcrypt.hash(password, 10);
      }

      // Mettre à jour l'utilisateur
      const result = await pool.query(
          "UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING id, name, email",
          [name || user.rows[0].name, email || user.rows[0].email, hashedPassword, userId]
      );

      console.log(`✅ Profil mis à jour avec succès pour ID: ${userId}`);

      res.json({ message: "Profil mis à jour avec succès", user: result.rows[0] });
  } catch (err) {
      console.error("❌ Erreur lors de la mise à jour du profil :", err);
      res.status(500).json({ error: err.message });
  }
});

app.delete("/delete-account", authenticateToken, async (req, res) => {
  try {
      const userId = req.user.id;

      console.log(`🗑️ Suppression du compte ID: ${userId}`);

      // Vérifier si l'utilisateur existe
      const user = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
      if (user.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      // Supprimer l'utilisateur en base
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);

      console.log(`✅ Compte supprimé avec succès ID: ${userId}`);

      res.json({ message: "Compte supprimé avec succès" });
  } catch (err) {
      console.error("❌ Erreur lors de la suppression du compte :", err);
      res.status(500).json({ error: err.message });
  }
});

app.get("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
      const { id } = req.params;

      console.log(`🔍 Recherche de l'utilisateur ID: ${id}`);

      const user = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [id]);

      if (user.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      res.json(user.rows[0]);
  } catch (err) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur :", err);
      res.status(500).json({ error: err.message });
  }
});

// 🔄 Modification d'un utilisateur (admin uniquement)
app.put("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      console.log(`✏️ Mise à jour de l'utilisateur ID: ${id}`);

      // Vérifier si l'utilisateur existe
      const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (user.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      // Mise à jour des informations
      const result = await pool.query(
          "UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role",
          [name || user.rows[0].name, email || user.rows[0].email, role || user.rows[0].role, id]
      );

      console.log(`✅ Utilisateur ID: ${id} mis à jour avec succès`);

      res.json({ message: "Utilisateur mis à jour avec succès", user: result.rows[0] });
  } catch (err) {
      console.error("❌ Erreur lors de la mise à jour de l'utilisateur :", err);
      res.status(500).json({ error: err.message });
  }
});

// 🗑️ Suppression d'un utilisateur (admin uniquement)
app.delete("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
      const { id } = req.params;

      console.log(`🗑️ Suppression de l'utilisateur ID: ${id}`);

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
});

// ✅ Inscription d’un utilisateur
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log(`🔄 Inscription de : ${name} - ${email}`);

    // Vérifier si l'utilisateur existe déjà
    const checkUser = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 Sécurisation : Si aucun rôle n’est fourni, mettre `user` par défaut
    const userRole = role === "admin" ? "admin" : "user";

    // Insérer le nouvel utilisateur dans la base
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, hashedPassword, userRole]
    );

    res
      .status(201)
      .json({ message: "Compte créé avec succès", user: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription :", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Connexion d’un utilisateur
app.post("/login", async (req, res) => {
  try {
      const { email, password } = req.body;
      console.log(`🔍 Tentative de connexion pour : ${email}`);

      // Vérifier si l'utilisateur existe
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (result.rows.length === 0) {
          console.warn(`❌ Échec de connexion : Email ${email} introuvable`);
          return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      const user = result.rows[0];

      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.warn(`❌ Échec de connexion : Mot de passe incorrect pour ${email}`);
          return res.status(401).json({ error: "Email ou mot de passe incorrect" });
      }

      console.log(`✅ Connexion réussie pour ${email} (ID: ${user.id}, Rôle: ${user.role})`);

      // Générer un JWT qui expire dans **7 jours**
      const accessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
      );

      // Générer un Refresh Token (90 jours)
      const refreshToken = crypto.randomBytes(64).toString("hex");

      // Stocker le Refresh Token en base
      await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

      console.log(`🔄 Tokens générés : AccessToken (7j) & RefreshToken (90j) pour ${email}`);

      res.json({ message: "Connexion réussie", accessToken, refreshToken });
  } catch (err) {
      console.error("❌ Erreur lors de la connexion :", err);
      res.status(500).json({ error: err.message });
  }
});

app.post("/refresh", refreshLimiter, async (req, res) => {
  try {
      const { refreshToken } = req.body;
      console.log(`🔄 Tentative de rafraîchissement du token...`);

      if (!refreshToken) {
          console.warn("❌ Aucun Refresh Token fourni");
          return res.status(401).json({ error: "Refresh token requis" });
      }

      // Vérifier si le Refresh Token existe en base
      const result = await pool.query("SELECT * FROM users WHERE refresh_token = $1", [refreshToken]);
      if (result.rows.length === 0) {
          console.warn(`❌ Échec : Refresh Token invalide`);
          return res.status(403).json({ error: "Refresh token invalide" });
      }

      const user = result.rows[0];
      console.log(`✅ Refresh Token valide pour ${user.email} (ID: ${user.id})`);

      // 🔄 Générer un NOUVEAU JWT valide 7 jours
      const newAccessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
      );

      // 🔄 Générer un NOUVEAU Refresh Token
      const newRefreshToken = crypto.randomBytes(64).toString("hex");

      // 🔥 Stocker le NOUVEAU Refresh Token en base et supprimer l’ancien
      await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [newRefreshToken, user.id]);

      console.log(`🔄 Nouveau AccessToken + RefreshToken générés pour ${user.email}`);

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
      console.error("❌ Erreur lors du rafraîchissement du token :", err);
      res.status(500).json({ error: err.message });
  }
});

// ✅ Route protégée pour récupérer le profil de l’utilisateur
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    console.log(`🔄 Profil demandé pour l'utilisateur ID: ${req.user.id}`);

    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération du profil :", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  try {
      const { refreshToken } = req.body;
      console.log(`🚪 Tentative de déconnexion...`);

      if (!refreshToken) {
          console.warn("❌ Échec : Aucun Refresh Token fourni");
          return res.status(401).json({ error: "Refresh token requis" });
      }

      // Supprimer le Refresh Token en base
      const result = await pool.query("UPDATE users SET refresh_token = NULL WHERE refresh_token = $1 RETURNING email", [refreshToken]);

      if (result.rows.length === 0) {
          console.warn("❌ Échec : Refresh Token introuvable en base");
          return res.status(403).json({ error: "Refresh token invalide" });
      }

      console.log(`✅ Déconnexion réussie pour ${result.rows[0].email}`);
      res.json({ message: "Déconnexion réussie" });
  } catch (err) {
      console.error("❌ Erreur lors de la déconnexion :", err);
      res.status(500).json({ error: err.message });
  }
});

app.post("/change-password", async (req, res) => {
  try {
      const { email, oldPassword, newPassword } = req.body;
      console.log(`🔐 Changement de mot de passe pour ${email}`);

      // Vérifier si l'utilisateur existe
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (result.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      const user = result.rows[0];

      // Vérifier l'ancien mot de passe
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
          return res.status(401).json({ error: "Ancien mot de passe incorrect" });
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 🔥 Mettre à jour le mot de passe en base
      await pool.query("UPDATE users SET password = $1, refresh_token = NULL WHERE email = $2", [hashedPassword, email]);

      console.log(`✅ Mot de passe changé avec succès pour ${email} (Toutes les sessions ont été invalidées)`);

      res.json({ message: "Mot de passe changé avec succès. Reconnectez-vous." });
  } catch (err) {
      console.error("❌ Erreur lors du changement de mot de passe :", err);
      res.status(500).json({ error: err.message });
  }
});


// ✅ Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // 🔥 Récupère le token envoyé par le client
  if (!token) {
    return res.status(401).json({ error: "Accès refusé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // 🔥 Vérifie que le token est valide
    req.user = decoded; // 🔥 Ajoute les infos du user (id, email) dans `req`
    next(); // 🔥 Passe à la prochaine étape
  } catch (err) {
    res.status(401).json({ error: "Token invalide" });
  }
}
// ✅ Middleware pour vérifier le token JWT
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // 🔥 Récupère le token envoyé par le client
  if (!token) {
    return res.status(401).json({ error: "Accès refusé, token manquant" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // 🔥 Vérifie que le token est valide
    req.user = decoded; // 🔥 Ajoute les infos du user (id, email) dans `req`
    next(); // 🔥 Passe à la prochaine étape
  } catch (err) {
    res.status(401).json({ error: "Token invalide" });
  }
}

function isAdmin(req, res, next) {
  console.log("Role de l'utilisateur:", req.user.role); // 🔥 Debugging

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès interdit, admin requis" });
  }
  next();
}

// ✅ Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});
