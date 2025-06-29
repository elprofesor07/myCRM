const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/auth');
const { userValidations, commonValidations } = require('../middleware/validation');
const userController = require('../controllers/userController');

// All routes require authentication
router.use(verifyToken);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userValidations.updateProfile, userController.updateProfile);
router.post('/profile/avatar', userController.uploadAvatar);
router.delete('/profile/avatar', userController.deleteAvatar);

// User preferences
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

// User activity
router.get('/activity', userController.getActivityLog);
router.get('/statistics', userController.getStatistics);

// Admin only routes
router.use(authorize('admin'));

// User management (admin)
router.get('/', commonValidations.pagination, userController.getAllUsers);
router.get('/:id', commonValidations.mongoId('id'), userController.getUserById);
router.put('/:id', commonValidations.mongoId('id'), userController.updateUser);
router.delete('/:id', commonValidations.mongoId('id'), userController.deleteUser);
router.post('/:id/activate', commonValidations.mongoId('id'), userController.activateUser);
router.post('/:id/deactivate', commonValidations.mongoId('id'), userController.deactivateUser);
router.post('/:id/reset-password', commonValidations.mongoId('id'), userController.resetUserPassword);

module.exports = router;