const { pool } = require("../config/database");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

        // ✅ Supprimer l'ancien refreshToken avant d'insérer le nouveau
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.id]);

        // ✅ Insérer le nouveau refreshToken
        await pool.query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '90 days')",
            [user.id, refreshToken]
        );

        res.json({ message: "Connexion réussie", accessToken, refreshToken });

    } catch (err) {
        console.error(" Erreur lors de la connexion :", err);
        res.status(500).json({ error: "Erreur serveur lors de la conneion." });
    }
};

const logout = async (req, res) => {
    try {
        console.log(`🔌 Tentative de déconnexion pour l'utilisateur ID: ${req.user?.id || "inconnu"}`);
        console.log("🔍 Contenu de req.user :", req.user);

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Utilisateur non authentifié." });
        }

        // ✅ Supprimer le refreshToken du user
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [req.user.id]);

        res.json({ message: "Déconnexion réussie" });
    } catch (err) {
        console.error("❌ Erreur lors de la déconnexion :", err);
        res.status(500).json({ error: "Erreur serveur lors de la déconnexion." });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Token manquant." });
        }

        console.log("🔍 RefreshToken reçu:", refreshToken);

        // Vérifie si le token existe
        const tokenResult = await pool.query(
            "SELECT user_id, token, expires_at FROM refresh_tokens WHERE token = $1",
            [refreshToken]
        );

        console.log("🔍 Token en base:", tokenResult.rows);

        if (tokenResult.rows.length === 0) {
            return res.status(403).json({ error: "Token invalide." });
        }

        // Récupération des infos du token
        const tokenInDb = tokenResult.rows[0];
        console.log("🔍 Info du token récupéré:", tokenInDb);

        // Vérification de l'expiration du refreshToken
        if (new Date(tokenInDb.expires_at) < new Date()) {
            console.log("⏳ RefreshToken expiré !");
            await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
            return res.status(403).json({ error: "Token expiré." });
        }

        // Récupérer les informations de l'utilisateur
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [tokenInDb.user_id]);

        if (userResult.rows.length === 0) {
            console.log("❌ Utilisateur introuvable !");
            return res.status(403).json({ error: "Utilisateur introuvable." });
        }

        const user = userResult.rows[0];

        // Générer un nouvel accessToken
        const newAccessToken = generateAccessToken(user);

        console.log("✅ Nouveau accessToken généré avec succès !");
        return res.json({ accessToken: newAccessToken });

    } catch (err) {
        console.error("❌ Erreur lors du rafraîchissement du token :", err);
        return res.status(500).json({ error: "Erreur serveur lors du rafraîchissement du token." });
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

        // ✅ Supprimer tous les refreshTokens après un changement de mot de passe
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [user.id]);

        // Mettre à jour le mot de passe
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, user.id]);

        console.log(`✅ Mot de passe changé avec succès pour ${email} (Toutes les sessions ont été invalidées)`);

        res.json({ message: "Mot de passe changé avec succès. Reconnectez-vous." });
    } catch (err) {
        console.error("❌ Erreur lors du changement de mot de passe :", err);
        res.status(500).json({ error: err.message });
    }
};


module.exports = { signup, login, logout, refreshToken, changePassword };
