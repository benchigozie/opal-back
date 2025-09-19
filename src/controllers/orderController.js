const { v4: uuidv4 } = require("uuid");
const id = uuidv4();
const axios = require("axios");
const prisma = require('../utils/prisma');
const { OrderStatus } = require("@prisma/client");




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
    console.error("Payment verification failed:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data, 
      headers: error.response?.headers,
    });
    return res.status(500).json({
      success: false,
      message: "Server error while verifying payment",
    });
  };
};


const getAllOrders = async (req, res) => {

  const validStatuses = Object.values(OrderStatus);

  const { page, limit, status } = req.query;

  const pageInt = parseInt(page, 10);
  const limitInt = parseInt(limit, 10);

  const filters = {};
  if (status && status !== "ALL") {
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }
    filters.status = status;
  }

  try {
    const orders = await prisma.order.findMany({
      where: filters,
      skip: (pageInt - 1) * limitInt,
      take: limitInt,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("this is orders:", orders)
    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({
      message: "Server error while fetching orders",
    });
  }
};

const getOrderById = async (req, res) => {
  const { orderId } = req.params; // UUID string

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }, // use string directly
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: { include: { images: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ message: "Server error while fetching order" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status }, 
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: { include: { product: { include: { images: true } } } },
      },
    });

    return res.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Failed to update order" });
  }
};

const getUsersOrders = async (req, res) => {
  console.log("Fetching orders for userId:", req.params.userId);
  const userId = parseInt(req.params.userId);


  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      message: "Server error while fetching orders",
    });
  }
};


module.exports = { verifyAndCreateOrder, getUsersOrders, getAllOrders, getOrderById, updateOrderStatus };