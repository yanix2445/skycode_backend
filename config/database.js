const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { require: true, rejectUnauthorized: false }
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log("✅ Connexion à PostgreSQL réussie !");
    } catch (err) {
        console.error("❌ Erreur de connexion à PostgreSQL :", err);
        process.exit(1);
    }
};

module.exports = { pool, connectDB };