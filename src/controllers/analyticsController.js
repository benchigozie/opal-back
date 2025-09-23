const prisma = require("../utils/prisma");

const getSummary = async (req, res) => {
  try {
    const totalSales = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: "DELIVERED" },
    });

    const pendingOrders = await prisma.order.count({
      where: { status: "PENDING" },
    });

    const lowStockItems = await prisma.product.count({
      where: { stock: { lt: 5 } },
    });

    const totalProductsSold = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
    });

    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const salesThisMonth = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: "DELIVERED",
        createdAt: { gte: firstDayThisMonth },
      },
    });

    const salesLastMonth = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: "DELIVERED",
        createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
      },
    });

    let salesGrowth = 0;
    if (salesLastMonth._sum.totalAmount) {
      salesGrowth =
        (salesThisMonth._sum.totalAmount - salesLastMonth._sum.totalAmount) /
        salesLastMonth._sum.totalAmount;
    }

    const productsThisMonth = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          status: "DELIVERED",
          createdAt: { gte: firstDayThisMonth },
        },
      },
    });

    const productsLastMonth = await prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          status: "DELIVERED",
          createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth },
        },
      },
    });

    let productsGrowth = 0;
    if (productsLastMonth._sum.quantity) {
      productsGrowth =
        (productsThisMonth._sum.quantity - productsLastMonth._sum.quantity) /
        productsLastMonth._sum.quantity;
    }

    const summary = {
      totalSales: totalSales._sum.totalAmount || 0,
      pendingOrders,
      lowStockItems,
      totalProductsSold: totalProductsSold._sum.quantity || 0,
      salesGrowth,
      productsGrowth,
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getSummary };
