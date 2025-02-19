require("dotenv").config();
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // 🔥 Utilisation de bcryptjs au lieu de bcrypt

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

// ✅ Ajouter un utilisateur
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log(`🔄 Ajout d'un utilisateur : ${name} - ${email}`);

    // Vérifier si l'email existe déjà
    const checkUser = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "L'email est déjà utilisé" });
    }

    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    console.log("✅ Utilisateur ajouté :", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erreur lors de l'ajout d'un utilisateur :", err);
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
    console.log(`🔄 Connexion de : ${email}`);

    // Vérifier si l'utilisateur existe
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // 🔥 Générer le token JWT avec `id`, `email` et `role`
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },  
      SECRET_KEY,
      { expiresIn: "1h" }
  );

    res.json({ message: "Connexion réussie", token });
  } catch (err) {
    console.error("❌ Erreur lors de la connexion :", err);
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
