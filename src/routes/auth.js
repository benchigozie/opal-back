const express = require("express");
const router = express.Router();

const { registerUser, loginUser, logoutUser, verifyEmail, googleLogin } = require("../controllers/authcontroller");
const authUserMiddleware = require("../middleware/authUserMiddleware");


router.post("/register",  registerUser);
router.post("/login", loginUser);
router.post("/logout", authUserMiddleware, logoutUser);
router.post('/google', googleLogin);

router.get('/verify-email/:token', verifyEmail);

module.exports = router;