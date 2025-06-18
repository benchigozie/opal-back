const express = require("express");
const router = express.Router();

const { refreshAccessToken } = require("../controllers/tokenController");

router.post("/refresh",  refreshAccessToken);

module.exports = router;