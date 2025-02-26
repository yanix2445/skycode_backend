const express = require("express");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/checkRole");

const router = express.Router();

router.get("/", authenticateToken, checkRole(2, 1), getAllUsers); // System Administrator (2) et Super Administrator (1) 
router.put("/:id", authenticateToken, checkRole(2, 1), updateUser); 
router.delete("/:id", authenticateToken, checkRole(2, 1), deleteUser); 
router.get("/users/:id", authenticateToken, getUserById);

module.exports = router;