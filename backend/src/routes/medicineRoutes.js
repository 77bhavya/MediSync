const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken); // Protect all medicine endpoints

router.get('/', medicineController.getAllMedicines);
router.post('/', medicineController.createMedicine);
router.get('/:id', medicineController.getMedicineById);
router.put('/:id', medicineController.updateMedicine);
router.delete('/:id', medicineController.deleteMedicine);
router.post('/:id/refill', medicineController.refillMedicineStock);

module.exports = router;

