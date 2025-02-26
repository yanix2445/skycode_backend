const express = require("express");
const { signup, login, logout, refreshToken , changePassword } = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { pool } = require("../config/database");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post("/change-password", changePassword);
router.get("/debug/tokens", authenticateToken, async (req, res) => {
  try {
      console.log("🛠️ Récupération des refreshTokens en cours...");
      const result = await pool.query("SELECT * FROM refresh_tokens");
      res.json(result.rows);
  } catch (err) {
      console.error("❌ Erreur lors de la récupération des tokens :", err);
      res.status(500).json({ error: "Erreur serveur lors de la récupération des tokens." });
  }
});

module.exports = router;