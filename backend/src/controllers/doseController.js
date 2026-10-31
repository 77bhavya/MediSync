const { query } = require('../config/db');

function parseScheduledTimes(times) {
  if (Array.isArray(times)) return times;
  try {
    const parsed = JSON.parse(times);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record a dose action: taken, skipped, snoozed
 * Enforces duplicate prevention and manages stock decrement.
 */
async function recordDoseAction(req, res, next) {
  try {
    const userId = req.user.id;
    const { medicine_id, scheduled_date, scheduled_time, status, notes } = req.body;

    if (!medicine_id || !scheduled_date || !scheduled_time || !status) {
      return res.status(400).json({
        success: false,
        message: 'medicine_id, scheduled_date, scheduled_time, and status are required.',
      });
    }

    const validStatuses = ['taken', 'skipped', 'snoozed', 'missed'];
    const cleanStatus = status.toLowerCase();
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Verify medicine ownership
    const [medRows] = await query(
      'SELECT id, name, quantity, refill_threshold FROM medicines WHERE id = ? AND user_id = ?',
      [medicine_id, userId]
    );

    if (!medRows || medRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found or access denied.' });
    }

    const medicine = medRows[0];

    // Check if a dose record already exists for this exact occurrence
    const [existingLogs] = await query(
      'SELECT id, status FROM dose_logs WHERE medicine_id = ? AND scheduled_date = ? AND scheduled_time = ?',
      [medicine_id, scheduled_date, scheduled_time]
    );

    let previousStatus = null;
    let logId = null;

    if (existingLogs && existingLogs.length > 0) {
      previousStatus = existingLogs[0].status;
      logId = existingLogs[0].id;

      // Update existing record
      await query(
        `UPDATE dose_logs 
         SET status = ?, action_timestamp = CURRENT_TIMESTAMP, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [cleanStatus, notes ? notes.trim() : null, logId, userId]
      );
    } else {
      // Insert new record (enforced unique by database constraint as well)
      const [insertRes] = await query(
        `INSERT INTO dose_logs 
         (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        [userId, medicine_id, scheduled_date, scheduled_time, cleanStatus, notes ? notes.trim() : null]
      );
      logId = insertRes.insertId;
    }

    // Stock management logic:
    // Decrement stock ONLY when marked 'taken' and previousStatus wasn't already 'taken'
    let updatedQuantity = medicine.quantity;
    if (cleanStatus === 'taken' && previousStatus !== 'taken') {
      updatedQuantity = Math.max(0, medicine.quantity - 1);
      await query('UPDATE medicines SET quantity = ? WHERE id = ?', [updatedQuantity, medicine_id]);
    } else if (previousStatus === 'taken' && cleanStatus !== 'taken') {
      // If user accidentally marked taken and reverts to skipped/snoozed, restore the 1 unit
      updatedQuantity = medicine.quantity + 1;
      await query('UPDATE medicines SET quantity = ? WHERE id = ?', [updatedQuantity, medicine_id]);
    }

    const isLowStock = updatedQuantity <= medicine.refill_threshold;

    return res.status(200).json({
      success: true,
      message: `Dose marked as ${cleanStatus}.`,
      logId,
      status: cleanStatus,
      medicineStock: updatedQuantity,
      isLowStock,
      lowStockWarning: isLowStock ? `Stock for ${medicine.name} is running low (${updatedQuantity} remaining). Consider refilling soon.` : null,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A dose record for this scheduled time already exists.',
      });
    }
    next(err);
  }
}

/**
 * Get Medication History with date and status filters
 */
async function getDoseHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const { startDate, endDate, status, medicineId, limit = 100, page = 1 } = req.query;

    let sql = `
      SELECT d.*, m.name as medicine_name, m.dosage, m.form, m.instructions
      FROM dose_logs d
      JOIN medicines m ON d.medicine_id = m.id
      WHERE d.user_id = ?
    `;
    const params = [userId];

    if (startDate) {
      sql += ' AND d.scheduled_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND d.scheduled_date <= ?';
      params.push(endDate);
    }
    if (status && status !== 'all') {
      sql += ' AND d.status = ?';
      params.push(status.toLowerCase());
    }
    if (medicineId) {
      sql += ' AND d.medicine_id = ?';
      params.push(medicineId);
    }

    sql += ' ORDER BY d.scheduled_date DESC, d.scheduled_time DESC';

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 200);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Fetch records
    const [records] = await query(sql, params);
    const paginated = records.slice(offset, offset + parsedLimit);

    return res.status(200).json({
      success: true,
      total: records.length,
      page: parsedPage,
      limit: parsedLimit,
      records: paginated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recordDoseAction,
  getDoseHistory,
};

