const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signup = async (req, res) => {
    try {
        const { name, email, password, role = "user" } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashedPassword, role]
        );

        res.status(201).json({ message: "Utilisateur créé avec succès", user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }

        const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        const refreshToken = crypto.randomBytes(64).toString("hex");

        await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

        res.json({ message: "Connexion réussie", accessToken, refreshToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        await pool.query("UPDATE users SET refresh_token = NULL WHERE refresh_token = $1", [refreshToken]);
        res.json({ message: "Déconnexion réussie" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const refreshToken = async (req, res) => {
  try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
          return res.status(401).json({ error: "Refresh token requis" });
      }

      // Vérifier si le Refresh Token existe en base
      const result = await pool.query("SELECT * FROM users WHERE refresh_token = $1", [refreshToken]);
      if (result.rows.length === 0) {
          return res.status(403).json({ error: "Refresh token invalide" });
      }

      const user = result.rows[0];

      // Générer un NOUVEAU JWT valide 7 jours
      const newAccessToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
      );

      // Générer un NOUVEAU Refresh Token
      const newRefreshToken = crypto.randomBytes(64).toString("hex");

      // Mettre à jour le Refresh Token en base
      await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [newRefreshToken, user.id]);

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};


const changePassword = async (req, res) => {
  try {
      const { email, oldPassword, newPassword } = req.body;
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

      if (user.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur introuvable" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.rows[0].password);
      if (!isMatch) {
          return res.status(401).json({ error: "Ancien mot de passe incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);

      res.json({ message: "Mot de passe changé avec succès" });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

module.exports = { signup, login, logout, refreshToken, changePassword };
