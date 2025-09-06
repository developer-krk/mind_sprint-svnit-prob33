const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "SVNIT2028";

function verifyToken(req, res, next) {
    try {
        const token = req.cookies.auth_token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                msg: "Access denied. No token provided." 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                msg: "Token has expired" 
            });
        }
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                msg: "Invalid token" 
            });
        }
        
        return res.status(500).json({ 
            success: false, 
            msg: "Token verification failed" 
        });
    }
}

// Optional: Get user info from token
const getUserFromToken = (req, res) => {
    try {
        const token = req.cookies.auth_token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                msg: "No token provided" 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ 
            success: true, 
            user: { 
                id: decoded.id, 
                username: decoded.username 
            } 
        });
    } catch (err) {
        console.error('Get user error:', err.message);
        return res.status(401).json({ 
            success: false, 
            msg: "Invalid or expired token" 
        });
    }
};

module.exports = { verifyToken, getUserFromToken };