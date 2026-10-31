const request = require('supertest');
const app = require('../src/server');
const { initDatabase } = require('../src/config/db');

let userToken = null;
let medAId = null;
let medZeroStockId = null;

beforeAll(async () => {
  await initDatabase();

  // Create isolated test user
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Adherence & Edge Case Tester',
      email: `adherence_${Date.now()}@test.com`,
      password: 'Password123!',
    });
  userToken = regRes.body.token;

  // Create Medicine A: 2 daily doses (08:00, 20:00), quantity 3, refill_threshold 2
  const medARes = await request(app)
    .post('/api/medicines')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Glipizide',
      dosage: '5 mg',
      form: 'Tablet',
      frequency: 'Twice daily',
      scheduled_times: ['08:00', '20:00'],
      start_date: '2026-10-01',
      quantity: 3,
      refill_threshold: 2,
    });
  medAId = medARes.body.medicineId;

  // Create Medicine with 0 stock
  const medZeroRes = await request(app)
    .post('/api/medicines')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Emergency Inhaler',
      dosage: '1 puff',
      form: 'Inhaler',
      frequency: 'Once daily',
      scheduled_times: ['14:00'],
      start_date: '2026-10-01',
      quantity: 0,
      refill_threshold: 1,
    });
  medZeroStockId = medZeroRes.body.medicineId;
});

describe('MediSync Reminders, Dose Actions & Adherence Edge Cases', () => {
  const testDate = '2026-10-25';

  test('Action "snoozed" persists to database and does NOT decrement stock', async () => {
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medAId,
        scheduled_date: testDate,
        scheduled_time: '08:00',
        status: 'snoozed',
        notes: 'Snoozed for 15 minutes',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('snoozed');
    expect(res.body.medicineStock).toBe(3); // Initial stock 3 was not changed
  });

  test('Action "taken" triggers low-stock alert when quantity drops to refill_threshold', async () => {
    // Current stock is 3, threshold is 2. Taking 1 drops stock to 2 (<= threshold)
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medAId,
        scheduled_date: testDate,
        scheduled_time: '08:00',
        status: 'taken',
        notes: 'Taken after breakfast',
      });

    expect(res.status).toBe(200);
    expect(res.body.medicineStock).toBe(2);
    expect(res.body.isLowStock).toBe(true);
    expect(res.body.lowStockWarning).toBeDefined();
    expect(res.body.lowStockWarning).toContain('Glipizide is running low');
  });

  test('Multiple daily dose times are tracked independently without collision', async () => {
    // Take morning dose (08:00) -> already taken
    // Now skip evening dose (20:00)
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medAId,
        scheduled_date: testDate,
        scheduled_time: '20:00',
        status: 'skipped',
        notes: 'Fasting test',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('skipped');

    // Verify history returns 2 distinct records for this date
    const histRes = await request(app)
      .get(`/api/doses/history?startDate=${testDate}&endDate=${testDate}&medicineId=${medAId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.records.length).toBe(2);
    const times = histRes.body.records.map(r => r.scheduled_time);
    expect(times).toContain('08:00');
    expect(times).toContain('20:00');
  });

  test('Out of stock edge case: taking dose when quantity=0 clamps at 0 (never negative)', async () => {
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medZeroStockId,
        scheduled_date: testDate,
        scheduled_time: '14:00',
        status: 'taken',
      });

    expect(res.status).toBe(200);
    expect(res.body.medicineStock).toBe(0); // Never drops to -1
  });

  test('Adherence Analytics calculates compliance strictly from stored database records', async () => {
    // For testDate:
    // Glipizide: 2 doses scheduled (08:00 taken, 20:00 skipped) -> 1 taken out of 2 = 50%
    // Emergency Inhaler: 1 dose scheduled (14:00 taken) -> 1 taken out of 1 = 100%
    // Total for testDate: 2 taken out of 3 scheduled = 67%
    const res = await request(app)
      .get('/api/analytics/adherence?days=7')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const trend = res.body.dailyTrend;
    expect(Array.isArray(trend)).toBe(true);
    const targetDay = trend.find(d => d.date === testDate);

    if (targetDay) {
      expect(targetDay.scheduled).toBe(3);
      expect(targetDay.taken).toBe(2);
      expect(targetDay.skipped).toBe(1);
      expect(targetDay.adherenceRate).toBe(67);
    }

    // Check medicine breakdown across the 7-day timeframe:
    // Glipizide had 1 taken out of all scheduled occurrences in this timeframe
    const medBreakdown = res.body.medicineBreakdown;
    const glipizideStats = medBreakdown.find(m => m.id === medAId);
    expect(glipizideStats).toBeDefined();
    expect(glipizideStats.taken).toBe(1);
    expect(glipizideStats.skipped).toBe(1);
    expect(glipizideStats.adherenceRate).toBe(Math.round((glipizideStats.taken / glipizideStats.scheduled) * 100));
  });

  test('Time-of-day compliance classifies morning, afternoon and evening correctly', async () => {
    const res = await request(app)
      .get('/api/analytics/adherence?days=7')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const timeSlots = res.body.timeOfDayBreakdown;
    const morning = timeSlots.find(s => s.slot === 'morning'); // 08:00
    const afternoon = timeSlots.find(s => s.slot === 'afternoon'); // 14:00
    const evening = timeSlots.find(s => s.slot === 'evening'); // 20:00

    expect(morning.taken).toBeGreaterThanOrEqual(1);
    expect(afternoon.taken).toBeGreaterThanOrEqual(1);
    expect(evening.scheduled).toBeGreaterThanOrEqual(1);
  });
});
