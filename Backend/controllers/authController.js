const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const { accessToken, refreshToken } = generateTokens(user._id);
  
  // Store refresh token
  user.refreshTokens.push({ token: refreshToken });
  
  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  
  user.save({ validateBeforeSave: false });

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: user.toJSON(),
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, timezone, language } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError('Email already registered', 400, 'EMAIL_EXISTS'));
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    timezone: timezone || 'UTC',
    language: language || 'en'
  });

  // Generate email verification token
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user, verifyToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  // Log registration
  logger.info(`New user registered: ${user.email}`);

  // Send token response
  sendTokenResponse(user, 201, res, 'Registration successful. Please verify your email.');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get('user-agent');

  // Find user with password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
    return next(new AppError(`Account locked. Try again in ${lockTime} minutes`, 423, 'ACCOUNT_LOCKED'));
  }

  // Check if account is active
  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED'));
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incLoginAttempts();
    user.addLoginHistory(ip, userAgent, false);
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
  }

  // Reset login attempts
  await user.resetLoginAttempts();
  user.addLoginHistory(ip, userAgent, true);
  await user.save({ validateBeforeSave: false });

  // Log successful login
  logger.info(`User logged in: ${user.email} from IP: ${ip}`);

  // Send token response
  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new AppError('Refresh token not provided', 401, 'NO_REFRESH_TOKEN'));
  }

  try {
    const { user, tokenId } = await verifyRefreshToken(refreshToken);

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED'));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });

    // Keep only last 5 refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save({ validateBeforeSave: false });

    // Cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res
      .status(200)
      .cookie('refreshToken', newRefreshToken, cookieOptions)
      .json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
        }
      });
  } catch (error) {
    logger.error('Refresh token error:', error);
    return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;
  const userId = req.user._id;

  // Remove refresh token from database
  if (refreshToken) {
    const user = await User.findById(userId).select('+refreshTokens');
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await user.save({ validateBeforeSave: false });
  }

  // Clear cookie
  res.clearCookie('refreshToken');

  logger.info(`User logged out: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // Remove all refresh tokens
  const user = await User.findById(userId).select('+refreshTokens');
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });

  // Clear cookie
  res.clearCookie('refreshToken');

  logger.info(`User logged out from all devices: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400, 'INVALID_TOKEN'));
  }

  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info(`Email verified for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.emailVerified) {
    return next(new AppError('Email already verified', 400, 'ALREADY_VERIFIED'));
  }

  // Generate new verification token
  const verifyToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await emailService.sendVerificationEmail(user, verifyToken);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED'));
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send reset email
  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
    
    res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save({ validateBeforeSave: false });
    
    return next(new AppError('Failed to send reset email', 500, 'EMAIL_SEND_FAILED'));
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() }
  }).select('+refreshTokens');

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN'));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;
  user.metadata.mustChangePassword = false;
  
  // Invalidate all refresh tokens for security
  user.refreshTokens = [];
  
  await user.save();

  logger.info(`Password reset for user: ${user.email}`);

  // Send confirmation email
  try {
    await emailService.sendPasswordChangeConfirmation(user);
  } catch (error) {
    logger.error('Failed to send password change confirmation:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, password } = req.body;
  const userId = req.user._id;

  // Get user with password field
  const user = await User.findById(userId).select('+password +refreshTokens');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return next(new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD'));
  }

  // Update password
  user.password = password;
  user.metadata.mustChangePassword = false;
  
  // Invalidate all refresh tokens except current
  const currentRefreshToken = req.cookies.refreshToken;
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token === currentRefreshToken);
  
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  // Send confirmation email
  try {
    await emailService.sendPasswordChangeConfirmation(user);
  } catch (error) {
    logger.error('Failed to send password change confirmation:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword
};