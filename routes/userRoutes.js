const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

router.get("/", authenticateToken, checkRole("admin", "super_admin"), getAllUsers);  // Accessible par les admins et plus
router.get("/:id", authenticateToken, getUserById); // Tout utilisateur peut voir son profil
router.put("/:id", authenticateToken, checkRole("admin"), updateUser); // Seul l'admin peut modifier un utilisateur
router.delete("/:id", authenticateToken, checkRole("super_admin"), deleteUser); // Seul le super admin peut supprimer un utilisateur

module.exports = router;