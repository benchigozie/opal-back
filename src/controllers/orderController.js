const { v4: uuidv4 } = require("uuid");
const id = uuidv4();
const axios = require("axios");
const prisma = require('../utils/prisma');



const verifyAndCreateOrder = async (req, res) => {
  const { reference, cartItems } = req.body;
  let userId = req.body.userId;

  if (!userId) {
    const guestUser = await prisma.user.create({
      data: {
        email: `guest_${uuidv4()}@opalspaces.com`,
        firstName: "Guest",
        lastName: "User",
      },
    });
    userId = guestUser.id;
  }

  try {

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
        },
      }
    );

    const data = response.data.data;

    if (data.status !== "success") {
      console.error("Payment verification failed:", data);
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    const productIds = cartItems.map((item) => item.id);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== cartItems.length) {
      return res.status(400).json({ success: false, message: "One or more products not found" });
    }

    let total = 3000;
    const orderItemsData = cartItems.map((item) => {
      const product = products.find((p) => p.id === item.id);
      const unitPrice = product.price;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      return {
        productId: item.id,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });

    const verifiedAmount = data.amount / 100;
    
    if (verifiedAmount !== total) {
      return res.status(400).json({ success: false, message: "Amount mismatch" });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: total,
        status: "PAID",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    return res.json({
      success: true,
      message: "Payment verified, order placed",
      order,
    });
  } catch (error) {
    console.error("Payment verification failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying payment",
    });
  };
};

module.exports = { verifyAndCreateOrder };