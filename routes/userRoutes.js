const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken, checkRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ Routes sécurisées avec les rôles
router.get("/", authenticateToken, checkRole(["admin", "manager"]), getAllUsers);
router.get("/:id", authenticateToken, checkRole(["admin", "manager", "user"]), getUserById);
router.put("/:id", authenticateToken, checkRole(["admin"]), updateUser);
router.delete("/:id", authenticateToken, checkRole(["admin"]), deleteUser);

module.exports = router;