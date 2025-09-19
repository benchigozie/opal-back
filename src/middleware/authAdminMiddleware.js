const jwt = require('jsonwebtoken');

const authAdminMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if (!decoded) {
            return res.status(404).json({ message: 'Invalid token' });
        } 
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        if (req.user.role !== "ADMIN" && req.user.role !== "EMPLOYEE") {
            return res.status(403).json({ message: 'Forbidden: Admin or Employee access required' });
        }

        if (req.user.role === "EMPLOYEE" && req.path.startsWith("/api/users")) {
            return res.status(403).json({ message: "Forbidden: Only Admins can access the users route" });
        }

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ message: 'Unauthorized' });
    }
      
};

module.exports = authAdminMiddleware;