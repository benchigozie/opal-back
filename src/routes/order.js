const express = require("express");
const router = express.Router();

const { verifyAndCreateOrder } = require('../controllers/orderController');

router.post("/verify", verifyAndCreateOrder);


module.exports = router;