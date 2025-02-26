const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // Assure-toi que c'est bien importé

const generateAccessToken = (user) => {
    console.log(`🔑 Génération d'un accessToken pour l'utilisateur ${user.email} (ID: ${user.id}, Rôle: ${user.role_name})`);
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            role_alias: user.role_alias,  
            role_name: user.role_name
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const generateRefreshToken = async (userId) => {
    const refreshToken = require("crypto").randomBytes(64).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // Expire dans 90 jours

    console.log(`🔄 Création d'un refreshToken pour l'utilisateur ID: ${userId}, expiration: ${expiresAt}`);

    await pool.query(
        "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
        [refreshToken, userId, expiresAt]
    );

    return refreshToken;
};

const cleanExpiredTokens = async () => {
    console.log("🧹 Début du nettoyage des refreshTokens expirés...");
    const result = await pool.query("DELETE FROM refresh_tokens WHERE expires_at < NOW()");
    console.log(`✅ Nettoyage terminé, tokens supprimés: ${result.rowCount}`);
};

// Exécuter toutes les 24h
setInterval(cleanExpiredTokens, 24 * 60 * 60 * 1000);

module.exports = { generateAccessToken, generateRefreshToken };