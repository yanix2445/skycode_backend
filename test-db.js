const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:Yanix244501@@db.aejupvrzokmyyzrqaarb.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Connexion réussie à PostgreSQL !");
    const res = await client.query("SELECT NOW();");
    console.log("📅 Heure actuelle :", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("❌ Erreur de connexion :", err);
  }
}

testConnection();
