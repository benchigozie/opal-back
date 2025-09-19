const prisma = require('../utils/prisma');

const getUserCart = async (req, res) => {

  try {
   
    const userId = parseInt(req.params.userId, 10);
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    
    res.status(200).json({ items: cart ? cart.items : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching cart" });
  }
};

const updateUserCart = async (req, res) => {
  
    try {
    const userId = parseInt(req.params.userId);
    
    const { items } = req.body;

    await prisma.cart.update({
      where: { userId },
      data: {
        items: {
          deleteMany: {},        
          create: items,        
        },
      },
    });

    res.status(200).json({ message: "Cart updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating cart" });
  }
};

const mergeCart = async (req, res) => {

  try {
    const userId = parseInt(req.params.userId, 10);
    const { guestItems } = req.body;

    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    const existingItems = userCart ? userCart.items : [];

    const mergedMap = new Map();

    existingItems.forEach(item => {
      mergedMap.set(item.productId, item.quantity); 
    });

    guestItems.forEach(guestItem => {
      const prevQty = mergedMap.get(guestItem.productId) || 0;
      mergedMap.set(guestItem.productId, prevQty + guestItem.quantity);
    });

    const mergedItems = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
      product: { connect: { id: productId } },
      quantity,
    }));


    const updatedCart = await prisma.cart.upsert({
      where: { userId },
      update: {
        items: {
          deleteMany: {},
          create: mergedItems,
        },
      },
      create: {
        userId,
        items: {
          create: mergedItems,
        },
      },
      include: {
        items: { 
          include: { 
            product: { 
              include: { images: true } 
            } 
          } 
        },
      },
    });

    res.status(200).json({ message: "Cart merged successfully", items: updatedCart.items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error merging cart" });
  }
};

const clearCart = async (req, res) => {
    try {
      const userId = req.params.userId;
  
      await prisma.cart.update({
        where: { userId },
        data: {
          items: {
            deleteMany: {},
          },
        },
      });
  
      res.status(200).json({ message: "Cart cleared" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error clearing cart" });
    }
  };

  module.exports = { 
    getUserCart, 
    updateUserCart, 
    mergeCart, 
    clearCart 
  };
