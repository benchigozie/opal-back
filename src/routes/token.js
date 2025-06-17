const express = require("express");
const router = express.Router();

const { refreshAccessToken } = require("../controllers/tokenController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/refresh-token", authMiddleware, refreshAccessToken);

module.exports = router;