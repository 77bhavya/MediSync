-- =====================================================================
-- MediSync - Sample Demo Data
-- College BCA Major Project
-- Clearly labelled demo dataset for testing, grading, and demonstration.
-- =====================================================================

USE medisync_db;

-- 1. Insert Demo User
-- Credentials:
-- Email: demo@medisync.local
-- Password: DemoPassword123!
-- Bcrypt Hash below generated with 10 salt rounds
INSERT INTO users (id, name, email, password_hash, phone, timezone)
VALUES (
    1,
    'Demo Patient (BCA Project)',
    'demo@medisync.local',
    '$2a$10$.7kMpqTKRzl7NY0wmT./9uuEGWP7Mw5WuyqAR.WyuGgMMLNxJmlHW',
    '+91 9876543210',
    'Asia/Kolkata'
) ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Notification Settings for Demo User
INSERT INTO notification_settings (user_id, browser_notifications, sound_enabled, lead_time_minutes, snooze_duration_minutes, email_notifications)
VALUES (
    1,
    TRUE,
    TRUE,
    10,
    15,
    FALSE
) ON DUPLICATE KEY UPDATE sound_enabled=VALUES(sound_enabled);

-- 3. Insert Sample Active Medicines
-- Notice realistic dosage text, frequency, start/end dates, quantity and refill threshold
INSERT INTO medicines (id, user_id, name, dosage, form, frequency, scheduled_times, start_date, end_date, quantity, refill_threshold, instructions, notes, is_active)
VALUES 
(
    1,
    1,
    'Metformin Hydrochloride',
    '500 mg',
    'Tablet',
    'Twice daily',
    '["08:00", "20:00"]',
    CURDATE() - INTERVAL 14 DAY,
    NULL,
    18,
    10,
    'With meals',
    'Take with breakfast and dinner. Do not skip meals.',
    TRUE
),
(
    2,
    1,
    'Amlodipine Besylate',
    '5 mg',
    'Tablet',
    'Once daily',
    '["09:00"]',
    CURDATE() - INTERVAL 14 DAY,
    NULL,
    4,
    7,
    'In the morning',
    'Blood pressure support. Low stock warning test item.',
    TRUE
),
(
    3,
    1,
    'Vitamin D3 (Cholecalciferol)',
    '60000 IU',
    'Capsule',
    'Once daily',
    '["13:00"]',
    CURDATE() - INTERVAL 7 DAY,
    NULL,
    25,
    5,
    'After food',
    'Take with fatty food or milk for optimal absorption.',
    TRUE
),
(
    4,
    1,
    'Atorvastatin',
    '10 mg',
    'Tablet',
    'Once daily',
    '["21:00"]',
    CURDATE() - INTERVAL 14 DAY,
    NULL,
    12,
    5,
    'At bedtime',
    'Take at bedtime as directed by doctor.',
    TRUE
)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert Dose Logs for past days (to generate realistic weekly adherence chart)
INSERT INTO dose_logs (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes)
VALUES
-- Yesterday doses
(1, 1, CURDATE() - INTERVAL 1 DAY, '08:00', 'taken', NOW() - INTERVAL 1 DAY, 'Taken on time'),
(1, 2, CURDATE() - INTERVAL 1 DAY, '09:00', 'taken', NOW() - INTERVAL 1 DAY, 'Taken with breakfast'),
(1, 3, CURDATE() - INTERVAL 1 DAY, '13:00', 'taken', NOW() - INTERVAL 1 DAY, 'Taken after lunch'),
(1, 1, CURDATE() - INTERVAL 1 DAY, '20:00', 'taken', NOW() - INTERVAL 1 DAY, 'Taken after dinner'),
(1, 4, CURDATE() - INTERVAL 1 DAY, '21:00', 'taken', NOW() - INTERVAL 1 DAY, 'Taken before bed'),

-- 2 Days ago doses (with 1 skipped for realistic metrics)
(1, 1, CURDATE() - INTERVAL 2 DAY, '08:00', 'taken', NOW() - INTERVAL 2 DAY, 'Taken on time'),
(1, 2, CURDATE() - INTERVAL 2 DAY, '09:00', 'taken', NOW() - INTERVAL 2 DAY, 'Taken on time'),
(1, 3, CURDATE() - INTERVAL 2 DAY, '13:00', 'skipped', NOW() - INTERVAL 2 DAY, 'Fasting for lab test'),
(1, 1, CURDATE() - INTERVAL 2 DAY, '20:00', 'taken', NOW() - INTERVAL 2 DAY, 'Taken on time'),
(1, 4, CURDATE() - INTERVAL 2 DAY, '21:00', 'taken', NOW() - INTERVAL 2 DAY, 'Taken on time'),

-- 3 Days ago doses
(1, 1, CURDATE() - INTERVAL 3 DAY, '08:00', 'taken', NOW() - INTERVAL 3 DAY, 'Taken on time'),
(1, 2, CURDATE() - INTERVAL 3 DAY, '09:00', 'taken', NOW() - INTERVAL 3 DAY, 'Taken on time'),
(1, 3, CURDATE() - INTERVAL 3 DAY, '13:00', 'taken', NOW() - INTERVAL 3 DAY, 'Taken on time'),
(1, 1, CURDATE() - INTERVAL 3 DAY, '20:00', 'taken', NOW() - INTERVAL 3 DAY, 'Taken on time'),
(1, 4, CURDATE() - INTERVAL 3 DAY, '21:00', 'taken', NOW() - INTERVAL 3 DAY, 'Taken on time')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 5. Insert Sample Refill Record
INSERT INTO stock_refills (user_id, medicine_id, quantity_added, notes)
VALUES (1, 1, 30, 'Initial pharmacy dispensary stock');
