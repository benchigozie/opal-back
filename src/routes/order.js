const express = require("express");
const router = express.Router();

const { verifyAndCreateOrder, getUsersOrders } = require('../controllers/orderController');

router.post("/verify", verifyAndCreateOrder);
router.get("/user/:userId", getUsersOrders);


module.exports = router;