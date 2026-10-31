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

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * GET /api/dashboard/summary
 * Comprehensive dashboard summary endpoint providing today's schedule,
 * adherence metrics, next upcoming dose, low-stock warnings, and recent activity.
 */
async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();
    const currentTime = getCurrentTimeString();

    // 1. Fetch user's active medicines
    const [medicines] = await query(
      `SELECT id, name, dosage, form, frequency, scheduled_times, quantity, refill_threshold, instructions, notes
       FROM medicines
       WHERE user_id = ? AND is_active = 1 AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)
       ORDER BY name ASC`,
      [userId, today, today]
    );

    // 2. Fetch today's logged doses
    const [doseLogs] = await query(
      `SELECT id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes
       FROM dose_logs
       WHERE user_id = ? AND scheduled_date = ?`,
      [userId, today]
    );

    const logMap = {};
    doseLogs.forEach((l) => {
      logMap[`${l.medicine_id}_${l.scheduled_time}`] = l;
    });

    // 3. Expand schedule occurrences
    const scheduleItems = [];
    let takenCount = 0;
    let skippedCount = 0;
    let snoozedCount = 0;
    let pendingCount = 0;

    medicines.forEach((med) => {
      const times = parseScheduledTimes(med.scheduled_times);
      times.forEach((time) => {
        const key = `${med.id}_${time}`;
        const log = logMap[key];

        let status = 'pending';
        let actionTimestamp = null;
        let doseNotes = null;
        let logId = null;

        if (log) {
          status = log.status;
          actionTimestamp = log.action_timestamp;
          doseNotes = log.notes;
          logId = log.id;
        }

        if (status === 'taken') takenCount++;
        else if (status === 'skipped') skippedCount++;
        else if (status === 'snoozed') snoozedCount++;
        else pendingCount++;

        const isOverdue = status === 'pending' && time < currentTime;

        scheduleItems.push({
          medicineId: med.id,
          medicineName: med.name,
          dosage: med.dosage,
          form: med.form,
          instructions: med.instructions,
          quantity: med.quantity,
          refillThreshold: med.refill_threshold,
          isLowStock: med.quantity <= med.refill_threshold,
          scheduledDate: today,
          scheduledTime: time,
          status,
          isOverdue,
          logId,
          actionTimestamp,
          notes: doseNotes || med.notes,
        });
      });
    });

    scheduleItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    // Next upcoming dose
    const nextReminder =
      scheduleItems.find(
        (item) => (item.status === 'pending' || item.status === 'snoozed') && item.scheduledTime >= currentTime
      ) ||
      scheduleItems.find((item) => item.status === 'pending') ||
      null;

    // Low stock items
    const lowStockItems = medicines.filter((m) => m.quantity <= m.refill_threshold);

    // 4. Fetch recent dose activity (last 5 actions)
    const [recentActivity] = await query(
      `SELECT d.id, d.scheduled_date, d.scheduled_time, d.status, d.action_timestamp, d.notes,
              m.name as medicine_name, m.dosage, m.form
       FROM dose_logs d
       JOIN medicines m ON d.medicine_id = m.id
       WHERE d.user_id = ?
       ORDER BY d.action_timestamp DESC, d.scheduled_date DESC, d.scheduled_time DESC
       LIMIT 5`,
      [userId]
    );

    const adherenceRate =
      scheduleItems.length > 0 ? Math.round((takenCount / scheduleItems.length) * 100) : 0;

    return res.status(200).json({
      success: true,
      today,
      metrics: {
        totalScheduled: scheduleItems.length,
        takenCount,
        skippedCount,
        snoozedCount,
        pendingCount,
        adherenceRate,
      },
      nextReminder,
      lowStockItems,
      todaySchedule: scheduleItems,
      recentActivity: recentActivity || [],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
};

