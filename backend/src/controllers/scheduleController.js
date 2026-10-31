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
 * Get Today's Full Medication Schedule & Summary Statistics
 */
async function getTodaySchedule(req, res, next) {
  try {
    const userId = req.user.id;
    const targetDate = req.query.date || getTodayDateString();
    const currentTime = getCurrentTimeString();

    // 1. Fetch active medicines valid for target date
    const [medicines] = await query(
      `SELECT id, name, dosage, form, frequency, scheduled_times, quantity, refill_threshold, instructions, notes
       FROM medicines
       WHERE user_id = ? AND is_active = 1 
         AND start_date <= ? 
         AND (end_date IS NULL OR end_date >= ?)
       ORDER BY name ASC`,
      [userId, targetDate, targetDate]
    );

    // 2. Fetch logged doses for target date
    const [loggedDoses] = await query(
      `SELECT id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes
       FROM dose_logs
       WHERE user_id = ? AND scheduled_date = ?`,
      [userId, targetDate]
    );

    const logMap = {};
    loggedDoses.forEach(l => {
      const key = `${l.medicine_id}_${l.scheduled_time}`;
      logMap[key] = l;
    });

    // 3. Expand each medicine by scheduled_times into dose items
    const scheduleItems = [];
    let takenCount = 0;
    let skippedCount = 0;
    let snoozedCount = 0;
    let pendingCount = 0;

    medicines.forEach(med => {
      const times = parseScheduledTimes(med.scheduled_times);
      times.forEach(time => {
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

        // Tally counts
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
          scheduledDate: targetDate,
          scheduledTime: time,
          status,
          isOverdue,
          logId,
          actionTimestamp,
          notes: doseNotes || med.notes,
        });
      });
    });

    // Sort items chronologically by scheduled time
    scheduleItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    // Determine next upcoming dose
    const nextReminder = scheduleItems.find(
      item => (item.status === 'pending' || item.status === 'snoozed') && item.scheduledTime >= currentTime
    ) || scheduleItems.find(item => item.status === 'pending') || null;

    // Filter low stock medicines
    const lowStockMedicines = medicines.filter(m => m.quantity <= m.refill_threshold);

    return res.status(200).json({
      success: true,
      targetDate,
      summary: {
        totalScheduled: scheduleItems.length,
        takenCount,
        skippedCount,
        snoozedCount,
        pendingCount,
        adherenceRate: scheduleItems.length > 0 ? Math.round((takenCount / scheduleItems.length) * 100) : 0,
      },
      nextReminder,
      lowStockItems: lowStockMedicines,
      schedule: scheduleItems,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Weekly Schedule View (Range of 7 Days)
 */
async function getWeeklySchedule(req, res, next) {
  try {
    const userId = req.user.id;
    const startDateParam = req.query.startDate;
    
    let start = startDateParam ? new Date(startDateParam) : new Date();
    // Normalize to beginning of date
    start.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }

    const minDate = days[0];
    const maxDate = days[6];

    // Fetch active medicines
    const [medicines] = await query(
      `SELECT id, name, dosage, form, scheduled_times, quantity, refill_threshold, instructions
       FROM medicines
       WHERE user_id = ? AND is_active = 1 
         AND start_date <= ? 
         AND (end_date IS NULL OR end_date >= ?)`,
      [userId, maxDate, minDate]
    );

    // Fetch dose logs in range
    const [doseLogs] = await query(
      `SELECT id, medicine_id, scheduled_date, scheduled_time, status
       FROM dose_logs
       WHERE user_id = ? AND scheduled_date >= ? AND scheduled_date <= ?`,
      [userId, minDate, maxDate]
    );

    const logMap = {};
    doseLogs.forEach(l => {
      const key = `${l.medicine_id}_${l.scheduled_date}_${l.scheduled_time}`;
      logMap[key] = l;
    });

    const weeklyData = days.map(dateStr => {
      const dayDoses = [];
      medicines.forEach(m => {
        const times = parseScheduledTimes(m.scheduled_times);
        times.forEach(t => {
          const key = `${m.id}_${dateStr}_${t}`;
          const log = logMap[key];
          dayDoses.push({
            medicineId: m.id,
            medicineName: m.name,
            dosage: m.dosage,
            form: m.form,
            scheduledTime: t,
            status: log ? log.status : 'pending',
          });
        });
      });
      dayDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      return {
        date: dateStr,
        doses: dayDoses,
        total: dayDoses.length,
        taken: dayDoses.filter(d => d.status === 'taken').length,
      };
    });

    return res.status(200).json({
      success: true,
      weekRange: { start: minDate, end: maxDate },
      days: weeklyData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Active Reminders for in-app alert banners & browser notification triggers
 */
async function getReminders(req, res, next) {
  try {
    const userId = req.user.id;
    const today = getTodayDateString();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Fetch user notification preferences
    const [prefRows] = await query('SELECT * FROM notification_settings WHERE user_id = ?', [userId]);
    const leadTime = prefRows && prefRows.length > 0 ? prefRows[0].lead_time_minutes : 10;
    const soundEnabled = prefRows && prefRows.length > 0 ? Boolean(prefRows[0].sound_enabled) : true;
    const browserNotif = prefRows && prefRows.length > 0 ? Boolean(prefRows[0].browser_notifications) : true;

    // Fetch active medicines
    const [medicines] = await query(
      `SELECT id, name, dosage, form, instructions, scheduled_times, quantity, refill_threshold
       FROM medicines
       WHERE user_id = ? AND is_active = 1 AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)`,
      [userId, today, today]
    );

    // Fetch today's logged doses
    const [loggedDoses] = await query(
      'SELECT medicine_id, scheduled_time, status, action_timestamp FROM dose_logs WHERE user_id = ? AND scheduled_date = ?',
      [userId, today]
    );

    const loggedMap = {};
    loggedDoses.forEach(l => {
      loggedMap[`${l.medicine_id}_${l.scheduled_time}`] = l;
    });

    const dueReminders = [];

    medicines.forEach(med => {
      const times = parseScheduledTimes(med.scheduled_times);
      times.forEach(timeStr => {
        const [h, m] = timeStr.split(':').map(Number);
        const doseMinutes = h * 60 + m;
        const log = loggedMap[`${med.id}_${timeStr}`];

        // If not taken or skipped
        if (!log || log.status === 'snoozed' || log.status === 'missed') {
          // Check if dose is within lead time window or overdue (within last 3 hours)
          const diffMinutes = doseMinutes - currentMinutes;

          // If due soon (within leadTime) or overdue up to 180 min
          if (diffMinutes <= leadTime && diffMinutes >= -180) {
            dueReminders.push({
              medicineId: med.id,
              medicineName: med.name,
              dosage: med.dosage,
              form: med.form,
              instructions: med.instructions,
              scheduledDate: today,
              scheduledTime: timeStr,
              diffMinutes,
              isOverdue: diffMinutes < 0,
              status: log ? log.status : 'pending',
              quantity: med.quantity,
              isLowStock: med.quantity <= med.refill_threshold,
            });
          }
        }
      });
    });

    return res.status(200).json({
      success: true,
      settings: {
        leadTime,
        soundEnabled,
        browserNotifications: browserNotif,
      },
      reminders: dueReminders,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTodaySchedule,
  getWeeklySchedule,
  getReminders,
};

