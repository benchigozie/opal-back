const express = require("express");
const router = express.Router();

const { verifyAndCreateOrder, getUsersOrders, getAllOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const authAdminMiddleware = require("../middleware/authAdminMiddleware");

router.post("/verify", verifyAndCreateOrder);
router.get("/user/:userId", getUsersOrders);
router.get("/all", authAdminMiddleware, getAllOrders);
router.get("/:orderId", authAdminMiddleware, getOrderById);
router.put("/status/:orderId", authAdminMiddleware, updateOrderStatus);

module.exports = router;