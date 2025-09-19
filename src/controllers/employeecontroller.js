const prisma = require("../utils/prisma");
const { Role } = require("@prisma/client");

const findUserByEmail = async (req, res) => {
  const { email } = req.query;
  console.log("Searching for user with email:", email);
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
        role: { not: Role.ADMIN }
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(201).json({ user });
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const promoteUser = async (req, res) => {
  const { id } = req.params;
  console.log("Promoting user with ID:", id);
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: Role.EMPLOYEE },
      select: { id: true, email: true, role: true }
    });

    return res.json({ message: "User promoted to EMPLOYEE", user: updatedUser });
  } catch (error) {
    console.error("Error promoting user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const demoteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: Role.USER },
      select: { id: true, email: true, role: true }
    });

    return res.json({ message: "User demoted to USER", user: updatedUser });
  } catch (error) {
    console.error("Error demoting user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: [Role.EMPLOYEE] }
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
      orderBy: { createdAt: "desc" }
    });

    return res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });

    return res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  findUserByEmail,
  promoteUser,
  demoteUser,
  getAllUsers,
  deleteUser
};