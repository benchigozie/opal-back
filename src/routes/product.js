const express = require("express");
const { createProduct, getAllProducts, getProductById, deleteProduct, } = require('../controllers/productController.js');

const { upload } = require('../middleware/upload.js');

const router = express.Router();

router.post('/', upload.array('images', 5), createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.delete('/:id', deleteProduct);

module.exports = router;
