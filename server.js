require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

console.log("🚀 Tentative de connexion...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

const app = express();
app.use(cors());
app.use(express.json()); // 🔥 Assure-toi que JSON est bien activé

app.get("/", async (req, res) => {
  res.send("🚀 API backend en ligne !");
});

// Route GET pour voir tous les utilisateurs
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Route POST pour ajouter un utilisateur
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});
