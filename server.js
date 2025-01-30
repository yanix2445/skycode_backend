require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à la base de données Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Nécessaire pour Railway
});

// Route de test
app.get("/", async (req, res) => {
  res.send("🚀 API backend en ligne !");
});

app.get("/db-test", async (req, res) => {
  try {
    console.log("Tentative de connexion à la base de données..");
    const client = await pool.connect();
    console.log("Connexion réussie !");
    const result = await client.query("SELECT NOW()"); // Test connexion DB
    client.release();
    res.json({ success: true, timestamp: result.rows[0] });
  } catch (err) {
    console.error("Erreur de connexion :", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});
