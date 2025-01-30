require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Déclaration en haut

console.log("Tentative de connexion à la base de données...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

async function testDB() {
  try {
    console.log("Connexion en cours...");
    const client = await pool.connect();
    console.log("Connexion réussie !");
    const result = await client.query("SELECT NOW()");
    console.log("Résultat :", result.rows[0]);
    client.release();
  } catch (error) {
    console.error("Erreur de connexion :", error);
  }
}

testDB();

const app = express();
app.use(cors());
app.use(express.json());

// Route de test
app.get("/", async (req, res) => {
  res.send("🚀 API backend en ligne !");
});

app.get("/test", async (req, res) => {
  res.send("🚀 API backend en ligne route /test !");
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});
