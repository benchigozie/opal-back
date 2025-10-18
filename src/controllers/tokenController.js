const jwt = require('jsonwebtoken');
const { generateAccessToken } = require('../utils/jwt');

const refreshAccessToken = async ( req, res ) => {
    try {
       
        const { refreshToken } = req.cookies;

        console.log("Cookies received in refresh token controller:", req.cookies);
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (!decoded) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken({ id: decoded.id, role: decoded.role });

        res.status(200).json({ accessToken });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    refreshAccessToken,
};