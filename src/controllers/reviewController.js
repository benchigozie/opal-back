const prisma = require('../utils/prisma');

const addReview = async (req, res) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
  
    try {
      const review = await prisma.review.create({
        data: {
          rating: parseInt(rating),
          comment,
          product: { connect: { id: productId } },
        },
      });
  
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add review'  });
    }
  };

  const getReviewsByProduct = async (req, res) => {
    const { productId } = req.params;
  
    try {
      const reviews = await prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      });
  
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  };
  
  module.exports = {
    addReview,
    getReviewsByProduct,
  };