const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

// ✅ Récupérer tous les utilisateurs (Réservé aux Admins et Super Admins)
router.get("/users", authenticateToken, checkRole([2, 1]), getAllUsers);

// ✅ Récupérer un utilisateur par son ID
router.get("/users/:id", authenticateToken, getUserById);

// ✅ Modifier son propre profil OU un Admin/Super Admin peut modifier d'autres utilisateurs
router.put("/users/:id", authenticateToken, updateUser);

// ✅ Supprimer un utilisateur (Seuls les Admins et Super Admins peuvent supprimer)
router.delete("/users/:id", authenticateToken, checkRole([2, 1]), deleteUser);

module.exports = router;