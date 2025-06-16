const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, verifyAccessToken } = require('../utils/jwt');



const registerUser = async (req, res) => {
  const { firstName, lastName, email, role, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status().json({ message: 'User already exists with this email' })
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const allowedRoles = ['USER', 'ADMIN'];
    const userRole = allowedRoles.includes(role) ? role : 'USER';

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role: userRole,
        password: hashedPassword,
      },
    });

    const accessToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: newUser.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' },
    );

    await prisma.user.update({
      where: { id: newUser.id },
      data: { refreshToken },
    });

    res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });


  } catch (error) { 
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const loginUser = (req, res) => {
  console.log("Logging in user:", req.body.email);
  res.status(200).json({ message: "User logged in (placeholder)" });
};
module.exports = { registerUser, loginUser };
