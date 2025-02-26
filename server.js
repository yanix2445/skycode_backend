const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

// Importation des routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes"); // Ajoute bien ça

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 Montage des routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes); // Assure-toi que cette ligne est bien présente

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ error: "Route non trouvée" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
});