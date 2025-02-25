const express = require("express");
const { getAllRoles } = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

// ✅ Assure-toi que cette route est bien déclarée
router.get("/", authenticateToken, checkRole("admin", "super_admin"), getAllRoles);
module.exports = router;