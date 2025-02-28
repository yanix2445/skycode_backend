const { Pool } = require("pg");
require("dotenv").config();

// Création d'un pool de connexions

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // 🔥 FORCER LE SSL 🔥
});

module.exports = pool;

// Fonction pour tester la connexion
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()"); // Test rapide
    console.log(
      "✅ Connexion à PostgreSQL réussie ! Heure actuelle :",
      res.rows[0].now
    );
    client.release(); // Libère la connexion après le test
  } catch (err) {
    console.error("❌ Erreur de connexion à PostgreSQL :", err.message);
  }
};

// Exportation du pool pour être utilisé partout
module.exports = { pool, connectDB };
