const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, 
  },
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connexion à PostgreSQL réussie !");
    client.release();
  } catch (err) {
    console.error("❌ Erreur de connexion à PostgreSQL :", err);
    process.exit(1); // Arrête l'application en cas d'échec
  }
};

module.exports = { pool, connectDB };