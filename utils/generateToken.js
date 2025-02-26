const jwt = require("jsonwebtoken");
const pool = require("../config/database"); // Assure-toi que c'est bien importé
const crypto = require("crypto");

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

// ✅ Correction : Retourner uniquement une chaîne de caractères (et non un objet)
const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex"); // Retourne juste un token string
};

// ✅ Supprimer les refreshTokens expirés toutes les 24h
const cleanExpiredTokens = async () => {
    console.log("🧹 Début du nettoyage des refreshTokens expirés...");
    const result = await pool.query("DELETE FROM refresh_tokens WHERE expires_at < NOW()");
    console.log(`✅ Nettoyage terminé, tokens supprimés: ${result.rowCount}`);
};

// Exécuter le nettoyage toutes les 24h
setInterval(cleanExpiredTokens, 24 * 60 * 60 * 1000);

module.exports = { generateAccessToken, generateRefreshToken };