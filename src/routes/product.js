const express = require("express");
const { createProduct, getProducts, getProductById, deleteProduct, updateProduct, getFeaturedProducts } = require('../controllers/productController.js');

const { upload } = require('../middleware/upload.js');
const authAdminMiddleware = require("../middleware/authAdminMiddleware.js");

const router = express.Router();

router.post('/create', authAdminMiddleware, upload.array('images', 5), createProduct);
router.get('/all', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);
router.delete('/:id', authAdminMiddleware, deleteProduct);
router.put('/update/:id', authAdminMiddleware, upload.array('images', 5), updateProduct); 

module.exports = router;
