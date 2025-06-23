const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
}

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
        return null;
    }
};

const generateEmailVerificationToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_EMAIL_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    generateEmailVerificationToken,
}

