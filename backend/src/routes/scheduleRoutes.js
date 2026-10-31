const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect schedule endpoints

router.get('/today', scheduleController.getTodaySchedule);
router.get('/weekly', scheduleController.getWeeklySchedule);
router.get('/reminders', scheduleController.getReminders);

module.exports = router;

