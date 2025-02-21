const express = require("express");
const { getAllRoles } = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

// 🚨 Seuls les Super Admins et Admins peuvent voir tous les rôles
router.get("/", authenticateToken, checkRole(6), getAllRoles);

module.exports = router;