const express = require("express");
const { assignRole } = require("../controllers/roleController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

// Un super admin peut attribuer n'importe quel rôle
// Un admin peut attribuer des rôles INFÉRIEURS à lui
router.post("/assign", authenticateToken, checkRole("admin"), assignRole);

module.exports = router;