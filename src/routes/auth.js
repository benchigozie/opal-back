const express = require("express");
const router = express.Router();

const { registerUser, loginUser, logoutUser, verifyEmail } = require("../controllers/authcontroller");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/register",  registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);

router.get('/verify-email/:token', verifyEmail);

module.exports = router;