const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh', tokenId: require('crypto').randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

// Verify access token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findById(decoded.userId).select('-password -refreshTokens');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    logger.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Verify refresh token
const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await User.findById(decoded.userId).select('+refreshTokens');

    if (!user) {
      throw new Error('User not found');
    }

    // Check if refresh token exists in user's token list
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      // Token reuse detected - invalidate all tokens for security
      user.refreshTokens = [];
      await user.save();
      throw new Error('Invalid refresh token - possible token reuse detected');
    }

    return { user, tokenId: decoded.tokenId };
  } catch (error) {
    throw error;
  }
};

// Role-based access control middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Department-based access control
const authorizeDepartment = (...departments) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!departments.includes(req.user.department)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to specific departments'
      });
    }

    next();
  };
};

// Resource ownership middleware
const checkResourceOwnership = (Model, resourceIdParam = 'id', ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Allow admins to access any resource
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership
      const ownerId = resource[ownerField];
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        // Check if user is in a special access list (e.g., watchers, participants)
        const hasSpecialAccess = checkSpecialAccess(resource, req.user._id);
        
        if (!hasSpecialAccess) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this resource'
          });
        }
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource permissions'
      });
    }
  };
};

// Check special access permissions
const checkSpecialAccess = (resource, userId) => {
  // Check various access lists
  const accessFields = ['watchers', 'participants', 'assignee', 'reporter'];
  
  for (const field of accessFields) {
    if (resource[field]) {
      if (Array.isArray(resource[field])) {
        if (resource[field].some(id => id.toString() === userId.toString())) {
          return true;
        }
      } else if (resource[field].toString() === userId.toString()) {
        return true;
      }
    }
  }
  
  return false;
};

// Email verification middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// API key authentication (for external integrations)
const authenticateAPIKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return next(); // Continue to regular auth
  }

  try {
    // In a real implementation, you would validate against stored API keys
    // For now, we'll check if it matches a pattern
    if (apiKey.startsWith('crm_api_')) {
      // Decode user from API key (in production, lookup from database)
      const userId = apiKey.split('_').pop();
      const user = await User.findById(userId).select('-password -refreshTokens');

      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.authMethod = 'api_key';
        return next();
      }
    }
  } catch (error) {
    logger.error('API key authentication error:', error);
  }

  // If API key auth fails, continue to regular auth
  next();
};

module.exports = {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  authorize,
  authorizeDepartment,
  checkResourceOwnership,
  requireEmailVerification,
  authenticateAPIKey
};