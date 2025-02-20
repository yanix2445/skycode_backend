const express = require("express");
const { signup, login, logout, refreshToken , changePassword } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.post("/change-password", changePassword);

module.exports = router;