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
 * Calculate Adherence Analytics across daily/weekly/monthly periods
 */
async function getAdherenceAnalytics(req, res, next) {
  try {
    const userId = req.user.id;
    const daysCount = parseInt(req.query.days, 10) || 7; // Default 7 days, can be 14 or 30

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // 1. Fetch user's medicines active in this range
    const [medicines] = await query(
      `SELECT id, name, dosage, form, scheduled_times, start_date, end_date
       FROM medicines
       WHERE user_id = ? AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)`,
      [userId, endDate, startDate]
    );

    // 2. Fetch logged doses for this user in this range
    const [doseLogs] = await query(
      `SELECT id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp
       FROM dose_logs
       WHERE user_id = ? AND scheduled_date >= ? AND scheduled_date <= ?`,
      [userId, startDate, endDate]
    );

    // Map logs for fast lookup: `medicineId_date_time`
    const logMap = {};
    doseLogs.forEach(l => {
      const key = `${l.medicine_id}_${l.scheduled_date}_${l.scheduled_time}`;
      logMap[key] = l;
    });

    // 3. Build daily adherence statistics
    let totalScheduledOverall = 0;
    let totalTakenOverall = 0;
    let totalSkippedOverall = 0;
    let totalMissedOverall = 0;
    let totalSnoozedOverall = 0;

    const medStatsMap = {};
    medicines.forEach(m => {
      medStatsMap[m.id] = {
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        form: m.form,
        scheduled: 0,
        taken: 0,
        skipped: 0,
        missed: 0,
      };
    });

    const timeOfDayMap = {
      morning: { label: 'Morning (05:00 - 11:59)', scheduled: 0, taken: 0 },
      afternoon: { label: 'Afternoon (12:00 - 16:59)', scheduled: 0, taken: 0 },
      evening: { label: 'Evening (17:00 - 20:59)', scheduled: 0, taken: 0 },
      night: { label: 'Night (21:00 - 04:59)', scheduled: 0, taken: 0 },
    };

    function getTimeOfDayCategory(timeStr) {
      const [h] = timeStr.split(':').map(Number);
      if (h >= 5 && h < 12) return 'morning';
      if (h >= 12 && h < 17) return 'afternoon';
      if (h >= 17 && h < 21) return 'evening';
      return 'night';
    }

    const dailyTrend = dates.map(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      let dayScheduled = 0;
      let dayTaken = 0;
      let daySkipped = 0;
      let dayMissed = 0;
      let daySnoozed = 0;

      medicines.forEach(med => {
        // Verify medicine was active on this specific date
        if (med.start_date <= dateStr && (!med.end_date || med.end_date >= dateStr)) {
          const times = parseScheduledTimes(med.scheduled_times);
          times.forEach(time => {
            dayScheduled++;
            totalScheduledOverall++;

            const timeCat = getTimeOfDayCategory(time);
            timeOfDayMap[timeCat].scheduled++;

            if (medStatsMap[med.id]) {
              medStatsMap[med.id].scheduled++;
            }

            const key = `${med.id}_${dateStr}_${time}`;
            const log = logMap[key];

            if (log) {
              if (log.status === 'taken') {
                dayTaken++;
                totalTakenOverall++;
                timeOfDayMap[timeCat].taken++;
                if (medStatsMap[med.id]) medStatsMap[med.id].taken++;
              } else if (log.status === 'skipped') {
                daySkipped++;
                totalSkippedOverall++;
                if (medStatsMap[med.id]) medStatsMap[med.id].skipped++;
              } else if (log.status === 'snoozed') {
                daySnoozed++;
                totalSnoozedOverall++;
              } else {
                dayMissed++;
                totalMissedOverall++;
                if (medStatsMap[med.id]) medStatsMap[med.id].missed++;
              }
            } else {
              // Not yet logged: if past date, count as missed
              if (dateStr < today.toISOString().split('T')[0]) {
                dayMissed++;
                totalMissedOverall++;
                if (medStatsMap[med.id]) medStatsMap[med.id].missed++;
              }
            }
          });
        }
      });

      const dayAdherence = dayScheduled > 0 ? Math.round((dayTaken / dayScheduled) * 100) : 0;

      return {
        date: dateStr,
        displayDate,
        dayName,
        scheduled: dayScheduled,
        taken: dayTaken,
        skipped: daySkipped,
        missed: dayMissed,
        snoozed: daySnoozed,
        adherenceRate: dayAdherence,
      };
    });

    // 4. Overall Adherence
    const overallAdherence = totalScheduledOverall > 0
      ? Math.round((totalTakenOverall / totalScheduledOverall) * 100)
      : 0;

    // 5. Calculate Consecutive Streak (consecutive days with scheduled doses where adherence >= 80%)
    let currentStreak = 0;
    if (totalScheduledOverall > 0) {
      for (let i = dailyTrend.length - 1; i >= 0; i--) {
        if (dailyTrend[i].scheduled > 0) {
          if (dailyTrend[i].adherenceRate >= 80) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // 6. Format medicine breakdown
    const medicineBreakdown = Object.values(medStatsMap)
      .filter(m => m.scheduled > 0)
      .map(m => ({
        ...m,
        adherenceRate: m.scheduled > 0 ? Math.round((m.taken / m.scheduled) * 100) : 0,
      }));

    // 7. Format time of day breakdown
    const timeOfDayBreakdown = Object.entries(timeOfDayMap).map(([key, val]) => ({
      slot: key,
      label: val.label,
      scheduled: val.scheduled,
      taken: val.taken,
      adherenceRate: val.scheduled > 0 ? Math.round((val.taken / val.scheduled) * 100) : 0,
    }));

    return res.status(200).json({
      success: true,
      timeframeDays: daysCount,
      range: { startDate, endDate },
      overall: {
        totalScheduled: totalScheduledOverall,
        totalTaken: totalTakenOverall,
        totalSkipped: totalSkippedOverall,
        totalMissed: totalMissedOverall,
        totalSnoozed: totalSnoozedOverall,
        adherenceRate: overallAdherence,
        currentStreakDays: currentStreak,
      },
      dailyTrend,
      medicineBreakdown,
      timeOfDayBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdherenceAnalytics,
};

