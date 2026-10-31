const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'medisync_super_secret_jwt_key_2026_default';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Register a new user
async function register(req, res, next) {
  try {
    const { name, email, password, phone, timezone } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a valid full name (minimum 2 characters).' });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing email
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const [userRes] = await query(
      'INSERT INTO users (name, email, password_hash, phone, timezone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, phone ? phone.trim() : null, timezone || 'Asia/Kolkata']
    );

    const userId = userRes.insertId;

    // Create default notification settings
    await query(
      'INSERT INTO notification_settings (user_id, browser_notifications, sound_enabled, lead_time_minutes, snooze_duration_minutes, email_notifications) VALUES (?, 1, 1, 10, 15, 0)',
      [userId]
    );

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      phone: phone || null,
      timezone: timezone || 'Asia/Kolkata',
    };

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Welcome to MediSync!',
      token,
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
}

// Log in user
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await query('SELECT id, name, email, password_hash, phone, timezone FROM users WHERE email = ?', [cleanEmail]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      timezone: user.timezone,
    };

    const token = generateToken(userProfile);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userProfile,
    });
  } catch (err) {
    next(err);
  }
}

// Get current user profile and settings
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const [userRows] = await query('SELECT id, name, email, phone, timezone, created_at FROM users WHERE id = ?', [userId]);

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [settingsRows] = await query('SELECT * FROM notification_settings WHERE user_id = ?', [userId]);

    return res.status(200).json({
      success: true,
      user: userRows[0],
      settings: settingsRows && settingsRows.length > 0 ? settingsRows[0] : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
};

