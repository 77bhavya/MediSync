const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect analytics

router.get('/adherence', analyticsController.getAdherenceAnalytics);

module.exports = router;

