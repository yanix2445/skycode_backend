const { pool } = require("../config/database");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { pool } = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ✅ Inscription d'un utilisateur
const signup = async (req, res) => {
    try {
        const { name, email, password, role_id } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Vérifier si un rôle a été fourni, sinon attribuer "user" par défaut
        let assignedRoleId = role_id;
        if (!role_id) {
            const defaultRole = await pool.query("SELECT id FROM roles WHERE alias = 'user' LIMIT 1");
            assignedRoleId = defaultRole.rows.length > 0 ? defaultRole.rows[0].id : 1; // Par défaut, 1 si user(0) ne passe pas
        }

        // Insérer l'utilisateur dans la DB
        const result = await pool.query(
            "INSERT INTO users (name, email, password, role_id, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *",
            [name, email, hashedPassword, assignedRoleId]
        );

        // Générer un token JWT
        const user = result.rows[0];
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Utilisateur créé avec succès",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role_id: user.role_id,
            },
            accessToken,
        });

    } catch (err) {
        console.error("❌ Erreur lors de l'inscription :", err);
        res.status(500).json({ error: "Erreur interne du serveur." });
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


const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        console.log(`🔄 Tentative de rafraîchissement du token...`);

        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token requis" });
        }

        // Vérifier si le Refresh Token existe en base
        const result = await pool.query("SELECT * FROM users WHERE refresh_token = $1", [refreshToken]);

        if (result.rows.length === 0) {
            return res.status(403).json({ error: "Refresh token invalide" });
        }

        const user = result.rows[0];
        console.log(`✅ Refresh Token valide pour ${user.email} (ID: ${user.id})`);

        // Générer un NOUVEAU JWT valide 7 jours
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Générer un NOUVEAU Refresh Token
        const newRefreshToken = crypto.randomBytes(64).toString("hex");

        // 🔥 Mettre à jour le Refresh Token en base
        await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [newRefreshToken, user.id]);

        console.log(`🔄 Nouveau AccessToken + RefreshToken générés pour ${user.email}`);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error("❌ Erreur lors du rafraîchissement du token :", err);
        res.status(500).json({ error: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        console.log(`🔐 Changement de mot de passe pour ${email}`);

        // Vérifier si l'utilisateur existe
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        const user = result.rows[0];

        // Vérifier l'ancien mot de passe
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Ancien mot de passe incorrect" });
        }

        // Hacher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 🔥 Mettre à jour le mot de passe en base + Réinitialiser le Refresh Token
        await pool.query("UPDATE users SET password = $1, refresh_token = NULL WHERE email = $2", [hashedPassword, email]);

        console.log(`✅ Mot de passe changé avec succès pour ${email} (Toutes les sessions ont été invalidées)`);

        res.json({ message: "Mot de passe changé avec succès. Reconnectez-vous." });
    } catch (err) {
        console.error("❌ Erreur lors du changement de mot de passe :", err);
        res.status(500).json({ error: err.message });
    }
};


module.exports = { signup, login, logout, refreshToken, changePassword };
