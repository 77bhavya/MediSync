const { initDatabase, query, getDbType, saveSqliteToFile } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function seedData() {
  console.log('[MediSync DB Init] Checking database initialization...');
  await initDatabase();
  const dbType = getDbType();
  console.log(`[MediSync DB Init] Active database engine: ${dbType}`);

  // Check if demo user already exists
  const [existingUsers] = await query('SELECT id FROM users WHERE email = ?', ['demo@medisync.local']);

  if (existingUsers && existingUsers.length > 0) {
    console.log('[MediSync DB Init] Demo user already exists. Database is ready.');
    return;
  }

  console.log('[MediSync DB Init] Seeding demo user and initial records...');
  const passwordHash = bcrypt.hashSync('DemoPassword123!', 10);

  // 1. Insert Demo User
  const [userResult] = await query(
    'INSERT INTO users (name, email, password_hash, phone, timezone) VALUES (?, ?, ?, ?, ?)',
    ['Demo Patient (BCA Project)', 'demo@medisync.local', passwordHash, '+91 9876543210', 'Asia/Kolkata']
  );
  const userId = userResult.insertId || 1;

  // 2. Insert Notification Settings
  await query(
    'INSERT INTO notification_settings (user_id, browser_notifications, sound_enabled, lead_time_minutes, snooze_duration_minutes, email_notifications) VALUES (?, 1, 1, 10, 15, 0)',
    [userId]
  );

  // 3. Insert Demo Medicines
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [med1] = await query(
    `INSERT INTO medicines (user_id, name, dosage, form, frequency, scheduled_times, start_date, quantity, refill_threshold, instructions, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [userId, 'Metformin Hydrochloride', '500 mg', 'Tablet', 'Twice daily', JSON.stringify(['08:00', '20:00']), formatDate(fourteenDaysAgo), 18, 10, 'With meals', 'Take with breakfast and dinner. Do not skip meals.']
  );

  const [med2] = await query(
    `INSERT INTO medicines (user_id, name, dosage, form, frequency, scheduled_times, start_date, quantity, refill_threshold, instructions, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [userId, 'Amlodipine Besylate', '5 mg', 'Tablet', 'Once daily', JSON.stringify(['09:00']), formatDate(fourteenDaysAgo), 4, 7, 'In the morning', 'Blood pressure support. Low stock warning demo item.']
  );

  const [med3] = await query(
    `INSERT INTO medicines (user_id, name, dosage, form, frequency, scheduled_times, start_date, quantity, refill_threshold, instructions, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [userId, 'Vitamin D3 (Cholecalciferol)', '60000 IU', 'Capsule', 'Once daily', JSON.stringify(['13:00']), formatDate(sevenDaysAgo), 25, 5, 'After food', 'Take after lunch with milk or water.']
  );

  const [med4] = await query(
    `INSERT INTO medicines (user_id, name, dosage, form, frequency, scheduled_times, start_date, quantity, refill_threshold, instructions, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [userId, 'Atorvastatin', '10 mg', 'Tablet', 'Once daily', JSON.stringify(['21:00']), formatDate(fourteenDaysAgo), 12, 5, 'At bedtime', 'Take at bedtime as directed by doctor.']
  );

  const m1Id = med1.insertId || 1;
  const m2Id = med2.insertId || 2;
  const m3Id = med3.insertId || 3;
  const m4Id = med4.insertId || 4;

  // 4. Seed Past 5 Days Dose Logs for realistic Adherence Chart
  for (let i = 1; i <= 5; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    const dateStr = formatDate(logDate);

    // Dose 1: Metformin morning
    await query(
      'INSERT INTO dose_logs (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, m1Id, dateStr, '08:00', 'taken', `${dateStr} 08:05:00`, 'Taken with breakfast']
    );

    // Dose 2: Amlodipine
    await query(
      'INSERT INTO dose_logs (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, m2Id, dateStr, '09:00', 'taken', `${dateStr} 09:10:00`, 'Taken on time']
    );

    // Dose 3: Vit D3 (skip on day 2 to create realistic variation)
    const vStatus = i === 2 ? 'skipped' : 'taken';
    await query(
      'INSERT INTO dose_logs (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, m3Id, dateStr, '13:00', vStatus, `${dateStr} 13:15:00`, i === 2 ? 'Fasting for routine lab blood test' : 'Taken after lunch']
    );

    // Dose 4: Metformin night
    await query(
      'INSERT INTO dose_logs (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, m1Id, dateStr, '20:00', 'taken', `${dateStr} 20:20:00`, 'Taken with dinner']
    );

    // Dose 5: Atorvastatin
    await query(
      'INSERT INTO dose_logs (user_id, medicine_id, scheduled_date, scheduled_time, status, action_timestamp, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, m4Id, dateStr, '21:00', 'taken', `${dateStr} 21:05:00`, 'Taken before bedtime']
    );
  }

  // 5. Seed an initial refill record
  await query(
    'INSERT INTO stock_refills (user_id, medicine_id, quantity_added, notes) VALUES (?, ?, ?, ?)',
    [userId, m1Id, 30, 'Initial pharmacy dispensary supply']
  );

  saveSqliteToFile();
  console.log('[MediSync DB Init] Seed completed successfully!');
  console.log('Demo Account: demo@medisync.local | Password: DemoPassword123!');
}

if (require.main === module) {
  seedData()
    .then(() => {
      // Allow event loop to wind down naturally
    })
    .catch((err) => {
      console.error('[MediSync DB Init] Error:', err);
      process.exitCode = 1;
    });
}

module.exports = { seedData };
