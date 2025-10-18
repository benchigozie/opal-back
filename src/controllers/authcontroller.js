const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, generateEmailVerificationToken } = require('../utils/jwt'); ////////////check later

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verifyCaptcha = async (token) => {
  const secret = process.env.CAPTCHA_SECRET_KEY;
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
  );
  return response.data.success;
};

const registerUser = async (req, res) => {
  const { firstName, lastName, email, role, password } = req.body.userInfo;
  const { captchaToken } = req.body;

  console.log(req.body)

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  if (!captchaToken) return res.status(400).json({ message: "Captcha token missing" });
  const isCaptchaValid = await verifyCaptcha(captchaToken);
  console.log("isCaptchaValid", isCaptchaValid);
  if (!isCaptchaValid) return res.status(400).json({ message: "Captcha verification failed" });

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' })
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

    const verificationToken = generateEmailVerificationToken(newUser);

    console.log("this is home url", process.env.HOME_URL)
    const verificationLink = `${process.env.HOME_URL}/verify-email/${verificationToken}`

    await sendVerificationEmail(newUser.email, verificationLink);


    res.status(201).json({
      message: 'User registered successfully, Check your email for verification link',
    });


  } catch (error) {

    res.status(500).json({ message: 'Internal server error' });
  }
};

const loginUser = async (req, res) => {

  const { email, password } = req.body.userInfo;
  const { captchaToken } = req.body;

  if (!captchaToken) return res.status(400).json({ message: "Captcha token missing" });
  const isCaptchaValid = await verifyCaptcha(captchaToken);
  console.log("isCaptchaValid", isCaptchaValid);
  if (!isCaptchaValid) return res.status(400).json({ message: "Captcha verification failed" });

  try {

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'No credential provided' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    console.log('Google ID token verified successfully');

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google did not return an email' });
    }

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: null,
          provider: 'google',
          verified: true,
          role: 'USER',
        },
      });
    } else {
      if (!user.verified || !user.provider) {
        user = await prisma.user.update({
          where: { email },
          data: {
            provider: 'google',
            verified: true,
            firstName,
            lastName,
          },
        });
      }
    };

    if (user) {
      if (user.provider && user.provider !== 'google') {
        return res.status(400).json({
          message: `This email is registered via ${user.provider}. Please sign in using that method.`,
        });
      }
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { email },
      data: { refreshToken },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    

    return res.status(200).json({
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('[GOOGLE LOGIN ERROR]', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {

    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);

    const existingUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (existingUser.verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    await prisma.user.update({
      where: { email: decoded.email },
      data: { verified: true },
    });

    return res.status(200).json({ message: 'Email successfully verified' });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(400).json({ message: 'Invalid or expired verification link' });
  }
};

const refreshToken = async (req, res) => {
  console.log("in refresh token controller");
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }  
    console.log("in refresh token function");
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        console.error("JWT Verify Error:", err.message, err.name);
        return res.status(403).json({ message: "Invalid refresh token" })
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

     if (user.refreshToken !== refreshToken) {
        return res.status(403).json({ message: "Token mismatch" });
      }

      const newAccessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "15m" } 
      );
      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("[REFRESH TOKEN ERROR]", error);
    res.status(500).json({ message: "Errror refreshing token" });
  }
};



const logoutUser = async (req, res) => {
  try {

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during logout' });
  }

}
module.exports = { registerUser, loginUser, logoutUser, verifyEmail, googleLogin, refreshToken };
