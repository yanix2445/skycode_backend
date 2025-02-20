const { pool } = require("../config/database");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signup = async (req, res) => {
    try {
        const { name, email, password, role = "user" } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
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

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        
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

module.exports = { signup, login, logout, refreshToken, changePassword };
