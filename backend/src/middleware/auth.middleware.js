const jwt = require('jsonwebtoken');
const { collection } = require('../db');
const { stripMongoId } = require('../utils/mongo');
require('dotenv').config();

const normalizeAccountStatus = (user) => {
  if (user.status) return user.status;
  return user.is_active === false ? 'rejected' : 'approved';
};

const sanitizeAuthUser = (user) => {
  const safeUser = stripMongoId(user);
  delete safeUser.password_hash;
  safeUser.status = normalizeAccountStatus(user);
  return safeUser;
};

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Please log in to continue' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await collection('users').findOne({ id: decoded.id });

    if (!user || user.is_active === false) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Please log in to continue' } });
    }

    req.user = sanitizeAuthUser(user);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Your session has expired. Please log in again.' } });
    }
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(role) ? role : [role];

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You don\'t have permission to perform this action' } });
    }
    next();
  };
};

const requireStatus = (status) => {
  return (req, res, next) => {
    const allowedStatuses = Array.isArray(status) ? status : [status];

    if (!req.user || !allowedStatuses.includes(req.user.status)) {
      return res.status(403).json({ error: { code: 'ACCOUNT_NOT_APPROVED', message: 'Your account is not approved for this action' } });
    }

    next();
  };
};

const requireApproved = requireStatus('approved');

module.exports = {
  requireAuth,
  requireApproved,
  requireRole,
  requireStatus,
};
