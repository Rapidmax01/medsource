const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../models');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { seller: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Require seller role
 */
const requireSeller = (req, res, next) => {
  const adminRoles = ['SUPER_ADMIN', 'SUB_ADMIN'];
  if (req.user.role !== 'SELLER' && !adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Seller access required' });
  }
  if (req.user.role === 'SELLER' && !req.user.seller) {
    return res.status(403).json({ error: 'Seller profile not set up' });
  }
  next();
};

/**
 * Require admin role (SUPER_ADMIN or SUB_ADMIN)
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SUB_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Require SUPER_ADMIN role only
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

/**
 * Optional auth - attach user if token present, continue otherwise
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { seller: true },
      });
    }
  } catch (e) {
    // Token invalid - continue without user
  }
  next();
};

module.exports = { authenticate, requireSeller, requireAdmin, requireSuperAdmin, optionalAuth };
