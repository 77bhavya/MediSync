const request = require('supertest');
const app = require('../src/server');
const { initDatabase } = require('../src/config/db');

let userToken = null;
let medId = null;

beforeAll(async () => {
  await initDatabase();

  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Dose Test User',
      email: `dosetest_${Date.now()}@test.com`,
      password: 'Password123!',
    });
  userToken = regRes.body.token;

  const medRes = await request(app)
    .post('/api/medicines')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Ibuprofen',
      dosage: '400 mg',
      form: 'Tablet',
      frequency: 'Once daily',
      scheduled_times: ['12:00'],
      start_date: '2026-10-01',
      quantity: 5,
      refill_threshold: 2,
    });
  medId = medRes.body.medicineId;
});

describe('MediSync Dose Actions, Duplicate Prevention & Stock Decrement Tests', () => {
  const todayStr = '2026-10-28';
  const scheduledTime = '12:00';

  test('POST /api/doses/action - Marking dose as "taken" decrements medicine stock by 1', async () => {
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medId,
        scheduled_date: todayStr,
        scheduled_time: scheduledTime,
        status: 'taken',
        notes: 'Taken on time with glass of water',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.medicineStock).toBe(4); // 5 - 1 = 4
  });

  test('POST /api/doses/action - Duplicate action on same occurrence does NOT double-decrement stock', async () => {
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medId,
        scheduled_date: todayStr,
        scheduled_time: scheduledTime,
        status: 'taken',
        notes: 'Repeated click check',
      });

    expect(res.status).toBe(200);
    expect(res.body.medicineStock).toBe(4); // Still 4, no double decrement!
  });

  test('POST /api/doses/action - Marking dose as "skipped" reverts the stock decrement', async () => {
    const res = await request(app)
      .post('/api/doses/action')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        medicine_id: medId,
        scheduled_date: todayStr,
        scheduled_time: scheduledTime,
        status: 'skipped',
        notes: 'Doctor advised skipping today',
      });

    expect(res.status).toBe(200);
    expect(res.body.medicineStock).toBe(5); // Reverted back to 5!
  });

  test('GET /api/doses/history - Fetches dose logs with status filter', async () => {
    const res = await request(app)
      .get('/api/doses/history?status=skipped')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.records.length).toBeGreaterThan(0);
    expect(res.body.records[0].status).toBe('skipped');
  });
});

