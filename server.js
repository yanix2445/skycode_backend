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

// Vérifier la connexion à la base de données
app.get("/db-test", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    res.json({ status: "✅ Connexion réussie", timestamp: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur de connexion :", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
      const { name, email } = req.body; // 🔥 Récupère `name` et `email` envoyés par le client
      const result = await pool.query(
          "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
          [name, email]
      ); // 🔥 Ajoute un nouvel utilisateur dans la base
      res.json(result.rows[0]); // 🔥 Renvoie l'utilisateur créé
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const { name, email } = req.body;

      const checkUser = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (checkUser.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const result = await pool.query(
          "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
          [name, email, id]
      );
      res.json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
      const { id } = req.params;

      const checkUser = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (checkUser.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      await pool.query("DELETE FROM users WHERE id = $1", [id]);
      res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});
