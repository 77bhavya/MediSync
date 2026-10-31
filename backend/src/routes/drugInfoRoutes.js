const express = require('express');
const router = express.Router();
const drugInfoController = require('../controllers/drugInfoController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Can be accessible to authenticated users
router.use(authenticateToken);

router.get('/search', drugInfoController.getDrugInformation);
router.get('/:id', drugInfoController.getDrugById);

module.exports = router;

