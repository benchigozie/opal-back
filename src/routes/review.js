const express = require('express');
const router = express.Router();

const {
  addReview,
  getReviewsByProduct,
} = require('../controllers/reviewController');

router.post('/:productId', addReview);
router.get('/:productId', getReviewsByProduct);

module.exports = router;