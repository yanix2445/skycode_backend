const express = require("express");
const { getAllRoles, assignRole } = require("../controllers/roleController"); // Vérifie bien cette ligne
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

// ✅ Route pour récupérer tous les rôles (réservée aux Super Admins et Admins)
router.get("/", authenticateToken, checkRole(6), getAllRoles);

// ✅ Route pour assigner un rôle à un utilisateur (Super Admin ou Admin)
router.post("/assign", authenticateToken, checkRole(6), assignRole);

module.exports = router;