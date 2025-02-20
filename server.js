require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à la base de données
connectDB();

// Chargement des routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});