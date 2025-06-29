const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { authValidations } = require('../middleware/validation');
const {
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
} = require('../controllers/authController');

// Public routes
router.post('/register', authValidations.register, register);
router.post('/login', authValidations.login, login);
router.post('/refresh', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authValidations.forgotPassword, forgotPassword);
router.post('/reset-password/:token', authValidations.resetPassword, resetPassword);

// Protected routes
router.use(verifyToken); // All routes below require authentication

router.get('/me', getMe);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.post('/resend-verification', resendVerification);
router.post('/change-password', authValidations.changePassword, changePassword);

module.exports = router;