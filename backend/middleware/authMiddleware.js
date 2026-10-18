require('dotenv').config();
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}

const JWT_SECRET = process.env.JWT_SECRET;

const protect = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        res.status(401);
        throw new Error('No token provided. Authorization denied.');
    }

    if (token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401);
        throw new Error('Invalid or expired authentication token');
    }
};

const optionalAuth = (req, res, next) => {
    let token = req.headers.authorization;
    if (token) {
        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            // Invalid token, proceed as guest
        }
    }
    next();
};

module.exports = protect;
module.exports.protect = protect;
module.exports.optionalAuth = optionalAuth;
module.exports.requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role || req.user.type)) {
        res.status(403);
        throw new Error('Insufficient permissions');
    }
    next();
};