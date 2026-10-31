const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// Update profile details (name, phone, timezone)
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, phone, timezone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    }

    await query(
      'UPDATE users SET name = ?, phone = ?, timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name.trim(), phone ? phone.trim() : null, timezone || 'Asia/Kolkata', userId]
    );

    const [userRows] = await query('SELECT id, name, email, phone, timezone FROM users WHERE id = ?', [userId]);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userRows[0],
    });
  } catch (err) {
    next(err);
  }
}

// Update notification settings
async function updateNotificationSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      browser_notifications,
      sound_enabled,
      lead_time_minutes,
      snooze_duration_minutes,
      email_notifications,
    } = req.body;

    // Check if settings record exists
    const [existing] = await query('SELECT id FROM notification_settings WHERE user_id = ?', [userId]);

    const browserNotif = browser_notifications ? 1 : 0;
    const sound = sound_enabled ? 1 : 0;
    const emailNotif = email_notifications ? 1 : 0;
    const leadTime = parseInt(lead_time_minutes, 10) || 10;
    const snoozeDur = parseInt(snooze_duration_minutes, 10) || 15;

    if (existing && existing.length > 0) {
      await query(
        `UPDATE notification_settings 
         SET browser_notifications = ?, sound_enabled = ?, lead_time_minutes = ?, snooze_duration_minutes = ?, email_notifications = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [browserNotif, sound, leadTime, snoozeDur, emailNotif, userId]
      );
    } else {
      await query(
        `INSERT INTO notification_settings 
         (user_id, browser_notifications, sound_enabled, lead_time_minutes, snooze_duration_minutes, email_notifications)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, browserNotif, sound, leadTime, snoozeDur, emailNotif]
      );
    }

    const [updated] = await query('SELECT * FROM notification_settings WHERE user_id = ?', [userId]);

    return res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      settings: updated[0],
    });
  } catch (err) {
    next(err);
  }
}

// Change password
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const [userRows] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, userRows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, userId]);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please keep it secure.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateProfile,
  updateNotificationSettings,
  changePassword,
};

