const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, isAdmin, getAllUsers);
router.get("/:id", authenticateToken, getUserById);
router.put("/:id", authenticateToken, isAdmin, updateUser);
router.delete("/:id", authenticateToken, isAdmin, deleteUser);

module.exports = router;