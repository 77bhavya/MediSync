const { query } = require('../config/db');

// Helper to safely parse JSON scheduled_times
function parseScheduledTimes(times) {
  if (Array.isArray(times)) return times;
  try {
    const parsed = JSON.parse(times);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Get all medicines for current user
async function getAllMedicines(req, res, next) {
  try {
    const userId = req.user.id;
    const { activeOnly, lowStockOnly } = req.query;

    let sql = 'SELECT * FROM medicines WHERE user_id = ?';
    const params = [userId];

    if (activeOnly === 'true') {
      sql += ' AND is_active = 1';
    }

    sql += ' ORDER BY is_active DESC, name ASC';

    const [medicines] = await query(sql, params);

    const formatted = medicines.map(m => {
      const times = parseScheduledTimes(m.scheduled_times);
      const isLowStock = m.quantity <= m.refill_threshold;
      return {
        ...m,
        is_active: Boolean(m.is_active),
        scheduled_times: times,
        isLowStock,
      };
    });

    if (lowStockOnly === 'true') {
      return res.status(200).json({
        success: true,
        count: formatted.filter(m => m.isLowStock).length,
        medicines: formatted.filter(m => m.isLowStock),
      });
    }

    return res.status(200).json({
      success: true,
      count: formatted.length,
      medicines: formatted,
    });
  } catch (err) {
    next(err);
  }
}

// Get single medicine by ID (with ownership check)
async function getMedicineById(req, res, next) {
  try {
    const userId = req.user.id;
    const medicineId = req.params.id;

    const [rows] = await query('SELECT * FROM medicines WHERE id = ? AND user_id = ?', [medicineId, userId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found or access denied.' });
    }

    const med = rows[0];
    med.is_active = Boolean(med.is_active);
    med.scheduled_times = parseScheduledTimes(med.scheduled_times);
    med.isLowStock = med.quantity <= med.refill_threshold;

    // Fetch recent refill history for this medicine
    const [refills] = await query(
      'SELECT id, quantity_added, refill_date, notes FROM stock_refills WHERE medicine_id = ? AND user_id = ? ORDER BY refill_date DESC LIMIT 10',
      [medicineId, userId]
    );

    return res.status(200).json({
      success: true,
      medicine: med,
      refills: refills || [],
    });
  } catch (err) {
    next(err);
  }
}

// Create new medicine record
async function createMedicine(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      name,
      dosage,
      form,
      frequency,
      scheduled_times,
      start_date,
      end_date,
      quantity,
      refill_threshold,
      instructions,
      notes,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Medicine name is required.' });
    }
    if (!dosage || dosage.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Dosage specification is required (e.g., 500 mg, 1 tablet).' });
    }
    if (!start_date) {
      return res.status(400).json({ success: false, message: 'Start date is required.' });
    }

    const validTimes = Array.isArray(scheduled_times) && scheduled_times.length > 0
      ? scheduled_times.map(t => t.trim()).filter(Boolean)
      : ['08:00'];

    const initialQuantity = parseInt(quantity, 10) >= 0 ? parseInt(quantity, 10) : 0;
    const threshold = parseInt(refill_threshold, 10) >= 0 ? parseInt(refill_threshold, 10) : 5;

    const [result] = await query(
      `INSERT INTO medicines 
       (user_id, name, dosage, form, frequency, scheduled_times, start_date, end_date, quantity, refill_threshold, instructions, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        name.trim(),
        dosage.trim(),
        form ? form.trim() : 'Tablet',
        frequency ? frequency.trim() : 'Once daily',
        JSON.stringify(validTimes),
        start_date,
        end_date || null,
        initialQuantity,
        threshold,
        instructions ? instructions.trim() : 'After food',
        notes ? notes.trim() : null,
      ]
    );

    const newId = result.insertId;

    // Log initial refill if initial quantity > 0
    if (initialQuantity > 0) {
      await query(
        'INSERT INTO stock_refills (user_id, medicine_id, quantity_added, notes) VALUES (?, ?, ?, ?)',
        [userId, newId, initialQuantity, 'Initial starting inventory']
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Medicine added successfully.',
      medicineId: newId,
    });
  } catch (err) {
    next(err);
  }
}

// Update existing medicine
async function updateMedicine(req, res, next) {
  try {
    const userId = req.user.id;
    const medicineId = req.params.id;

    // Ownership check
    const [existing] = await query('SELECT id FROM medicines WHERE id = ? AND user_id = ?', [medicineId, userId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found or access denied.' });
    }

    const {
      name,
      dosage,
      form,
      frequency,
      scheduled_times,
      start_date,
      end_date,
      quantity,
      refill_threshold,
      instructions,
      notes,
      is_active,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Medicine name is required.' });
    }
    if (!dosage || dosage.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Dosage is required.' });
    }

    const validTimes = Array.isArray(scheduled_times) && scheduled_times.length > 0
      ? scheduled_times.map(t => t.trim()).filter(Boolean)
      : ['08:00'];

    const targetQuantity = parseInt(quantity, 10) >= 0 ? parseInt(quantity, 10) : 0;
    const threshold = parseInt(refill_threshold, 10) >= 0 ? parseInt(refill_threshold, 10) : 5;
    const activeFlag = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    await query(
      `UPDATE medicines 
       SET name = ?, dosage = ?, form = ?, frequency = ?, scheduled_times = ?, 
           start_date = ?, end_date = ?, quantity = ?, refill_threshold = ?, 
           instructions = ?, notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        name.trim(),
        dosage.trim(),
        form ? form.trim() : 'Tablet',
        frequency ? frequency.trim() : 'Once daily',
        JSON.stringify(validTimes),
        start_date,
        end_date || null,
        targetQuantity,
        threshold,
        instructions ? instructions.trim() : 'After food',
        notes ? notes.trim() : null,
        activeFlag,
        medicineId,
        userId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Medicine updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// Delete medicine
async function deleteMedicine(req, res, next) {
  try {
    const userId = req.user.id;
    const medicineId = req.params.id;

    // Verify ownership
    const [existing] = await query('SELECT id FROM medicines WHERE id = ? AND user_id = ?', [medicineId, userId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found or access denied.' });
    }

    await query('DELETE FROM medicines WHERE id = ? AND user_id = ?', [medicineId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Medicine and associated records removed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// Refill medicine stock
async function refillMedicineStock(req, res, next) {
  try {
    const userId = req.user.id;
    const medicineId = req.params.id;
    const { quantityAdded, notes } = req.body;

    const qty = parseInt(quantityAdded, 10);
    if (!qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Please specify a positive refill quantity.' });
    }

    // Verify ownership
    const [existing] = await query('SELECT id, quantity, name FROM medicines WHERE id = ? AND user_id = ?', [medicineId, userId]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found or access denied.' });
    }

    const currentQty = existing[0].quantity;
    const newQty = currentQty + qty;

    // Update quantity
    await query('UPDATE medicines SET quantity = ? WHERE id = ? AND user_id = ?', [newQty, medicineId, userId]);

    // Record stock refill audit
    await query(
      'INSERT INTO stock_refills (user_id, medicine_id, quantity_added, notes) VALUES (?, ?, ?, ?)',
      [userId, medicineId, qty, notes ? notes.trim() : 'Pharmacy stock refill']
    );

    return res.status(200).json({
      success: true,
      message: `Stock for ${existing[0].name} updated (+${qty}). New stock count: ${newQty}.`,
      newQuantity: newQty,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  refillMedicineStock,
};

