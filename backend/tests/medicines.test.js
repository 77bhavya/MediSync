const request = require('supertest');
const app = require('../src/server');
const { initDatabase } = require('../src/config/db');

let userAToken = null;
let userBToken = null;
let medicineAId = null;

beforeAll(async () => {
  await initDatabase();

  // Create User A
  const resA = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User A',
      email: `usera_${Date.now()}@test.com`,
      password: 'Password123!',
    });
  userAToken = resA.body.token;

  // Create User B
  const resB = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User B',
      email: `userb_${Date.now()}@test.com`,
      password: 'Password123!',
    });
  userBToken = resB.body.token;
});

describe('MediSync Medicine Management & Ownership API Tests', () => {
  test('POST /api/medicines - User A creates a new medicine record', async () => {
    const res = await request(app)
      .post('/api/medicines')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Cetirizine',
        dosage: '10 mg',
        form: 'Tablet',
        frequency: 'Once daily',
        scheduled_times: ['21:00'],
        start_date: '2026-10-01',
        quantity: 15,
        refill_threshold: 5,
        instructions: 'At bedtime',
        notes: 'Allergy relief',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.medicineId).toBeDefined();
    medicineAId = res.body.medicineId;
  });

  test('GET /api/medicines - User A lists their medicines and sees the added item', async () => {
    const res = await request(app)
      .get('/api/medicines')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.medicines.some(m => m.id === medicineAId)).toBe(true);
  });

  test('GET /api/medicines/:id - User B CANNOT access User A medicine (404/Access Denied)', async () => {
    const res = await request(app)
      .get(`/api/medicines/${medicineAId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/medicines/:id - User B CANNOT update User A medicine', async () => {
    const res = await request(app)
      .put(`/api/medicines/${medicineAId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        name: 'Hacked Name',
        dosage: '1000 mg',
        start_date: '2026-10-01',
      });

    expect(res.status).toBe(404);
  });

  test('POST /api/medicines/:id/refill - User A refills medicine stock (+10 units)', async () => {
    const res = await request(app)
      .post(`/api/medicines/${medicineAId}/refill`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        quantityAdded: 10,
        notes: 'Monthly pharmacy refill purchase',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.newQuantity).toBe(25); // 15 + 10 = 25
  });

  test('DELETE /api/medicines/:id - User A deletes medicine successfully', async () => {
    const res = await request(app)
      .delete(`/api/medicines/${medicineAId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

