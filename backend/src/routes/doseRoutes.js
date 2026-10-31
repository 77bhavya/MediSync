const express = require('express');
const router = express.Router();
const doseController = require('../controllers/doseController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect dose endpoints

router.post('/action', doseController.recordDoseAction);
router.get('/history', doseController.getDoseHistory);

module.exports = router;

