const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'r_salon_super_secret_key_2026';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: Invalid Token Format' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // { username, role }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Access Denied: Invalid or Expired Token' });
  }
};

// Middleware to check if user is Super Admin
const requireSuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Access Denied: Super Admin role required' });
    }
  });
};

// Middleware to check if user is Admin or Super Admin
const requireAdminOrSuperAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Access Denied: Admin or Super Admin role required' });
    }
  });
};

module.exports = {
  JWT_SECRET,
  verifyToken,
  requireSuperAdmin,
  requireAdminOrSuperAdmin
};
