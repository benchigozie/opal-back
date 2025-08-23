const express = require("express");
const router = express.Router();

const { getUserCart, updateUserCart, mergeCart, clearCart } = require('../controllers/cartController');
const authUserMiddleware = require("../middleware/authUserMiddleware");

router.get('/:userId', authUserMiddleware, getUserCart);
router.put('/update/:userId', authUserMiddleware, updateUserCart);
router.post('/merge/:userId', authUserMiddleware, mergeCart);
router.delete('/:userId', authUserMiddleware, clearCart);


module.exports = router;