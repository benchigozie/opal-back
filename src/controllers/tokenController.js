const jwt = require('jsonwebtoken');

const refreshAccessToken = async ( req, res ) => {
    try {
        const { refreshToken } = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (!decoded) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

        res.status(200).json({ accessToken });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};