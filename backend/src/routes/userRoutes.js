const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.put('/profile', userController.updateProfile);
router.put('/settings', userController.updateNotificationSettings);
router.put('/change-password', userController.changePassword);

module.exports = router;

