require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Route de test
app.get("/", async (req, res) => {
  res.send("🚀 API backend en ligne !");
});
app.get("/test", async (req, res) => {
  res.send("🚀 API backend en ligne rout /test !");
});

const { Pool } = require("pg");

console.log("Tentative de connexion à la base de données...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});
