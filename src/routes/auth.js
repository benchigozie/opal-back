const express = require("express");
const router = express.Router();

const { registerUser, loginUser, logoutUser, verifyEmail, googleLogin } = require("../controllers/authcontroller");
const authMiddleware = require("../middleware/authMiddleware");


router.post("/register",  registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.post('/google', googleLogin);

router.get('/verify-email/:token', verifyEmail);

module.exports = router;