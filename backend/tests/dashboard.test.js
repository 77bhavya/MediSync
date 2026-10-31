const request = require('supertest');
const app = require('../src/server');
const { initDatabase } = require('../src/config/db');

let userToken = null;

beforeAll(async () => {
  await initDatabase();

  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Dashboard Tester',
      email: `dash_${Date.now()}@test.com`,
      password: 'Password123!',
    });
  userToken = regRes.body.token;

  // Add a sample medicine
  await request(app)
    .post('/api/medicines')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Multivitamin',
      dosage: '1 tablet',
      form: 'Tablet',
      frequency: 'Once daily',
      scheduled_times: ['08:00'],
      start_date: new Date().toISOString().split('T')[0],
      quantity: 3,
      refill_threshold: 5,
    });
});

describe('MediSync Dashboard API Tests', () => {
  test('GET /api/dashboard/summary - Returns metrics, todaySchedule, and lowStockItems for authenticated user', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics).toBeDefined();
    expect(res.body.metrics.totalScheduled).toBeGreaterThanOrEqual(1);
    expect(res.body.todaySchedule).toBeDefined();
    expect(res.body.lowStockItems).toBeDefined();
    expect(res.body.lowStockItems.length).toBeGreaterThanOrEqual(1); // quantity 3 <= threshold 5
  });

  test('GET /api/dashboard/summary - Fails without authentication token', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

