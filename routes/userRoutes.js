const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Routes Utilisateurs
router.get("/", authenticateToken, getAllUsers);
router.get("/:id", authenticateToken, getUserById);
router.put("/:id", authenticateToken, updateUser);  // 🔥 Ici, assure-toi que c'est bien en place !
router.delete("/:id", authenticateToken, deleteUser);

module.exports = router;