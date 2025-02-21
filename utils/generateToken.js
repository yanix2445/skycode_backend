const jwt = require("jsonwebtoken");

// ✅ Fonction pour générer un accessToken (valable 7 jours)
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id  },
        process.env.JWT_SECRET,
        { expiresIn: "7d" } // Token valide 7 jours
    );
};

// ✅ Fonction pour générer un refreshToken (valable 90 jours)
const generateRefreshToken = () => {
    return require("crypto").randomBytes(64).toString("hex");
};

module.exports = { generateAccessToken, generateRefreshToken };