const express = require("express");
const router = express.Router();
const authLimiter = require("../middleware/authLimiter");


const { registerUser, loginUser, logoutUser, verifyEmail, googleLogin, refreshToken } = require("../controllers/authcontroller");
const authUserMiddleware = require("../middleware/authUserMiddleware");


router.post("/register", authLimiter, registerUser);
router.post("/login", loginUser);
router.post("/logout", authUserMiddleware, logoutUser);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refreshToken);

router.get('/verify-email/:token', verifyEmail);

module.exports = router;