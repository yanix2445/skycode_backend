const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

// 🔹 Permet aux utilisateurs authentifiés de récupérer leur propre profil
router.get("/users/:id", authenticateToken, getUserById);

// 🔹 Permet aux utilisateurs authentifiés de modifier leur propre profil
router.put("/users/:id", authenticateToken, updateUser);

// 🔹 Uniquement les Admins et Super Admins peuvent supprimer un utilisateur
router.delete("/users/:id", authenticateToken, checkRole([2, 1]), deleteUser);

module.exports = router;