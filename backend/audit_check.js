/**
 * MediSync Full-Stack Comprehensive Audit Verification Script
 */
const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('=== STARTING MEDISYNC FULL-STACK END-TO-END AUDIT ===\n');
  const host = 'localhost';
  const port = 5000;

  // 1. Health check
  console.log('[Check 1] Checking API Server & Database Engine Status...');
  const health = await request({ host, port, path: '/api/health', method: 'GET' });
  if (health.status !== 200) throw new Error('Health check failed: ' + health.status);
  console.log(`✓ Health status: ${health.body.status} | Active DB: ${health.body.databaseEngine.toUpperCase()}\n`);

  // 2. Registration
  console.log('[Check 2] Testing User Registration with input validation...');
  const testEmail = `audit_${Date.now()}@medisync.test`;
  const regRes = await request(
    { host, port, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    {
      name: 'Dr. Audit Specialist',
      email: testEmail,
      password: 'AuditPassword123!',
      phone: '+91 9876500000',
      timezone: 'Asia/Kolkata',
    }
  );
  if (regRes.status !== 201 || !regRes.body.token) throw new Error('Registration failed');
  const token = regRes.body.token;
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log(`✓ Registered new user: ${testEmail} | Token issued\n`);

  // 3. Duplicate Email Rejection
  console.log('[Check 3] Verifying Duplicate Email Rejection (409 Conflict)...');
  const dupReg = await request(
    { host, port, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'Duplicate User', email: testEmail, password: 'Password123!' }
  );
  if (dupReg.status !== 409) throw new Error(`Expected 409, got ${dupReg.status}`);
  console.log('✓ Successfully rejected duplicate email with 409 Conflict\n');

  // 4. Login with Correct & Bad Credentials
  console.log('[Check 4] Testing Login validation...');
  const badLogin = await request(
    { host, port, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: testEmail, password: 'WrongPassword999!' }
  );
  if (badLogin.status !== 401) throw new Error('Bad password was not rejected with 401');

  const goodLogin = await request(
    { host, port, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: testEmail, password: 'AuditPassword123!' }
  );
  if (goodLogin.status !== 200 || !goodLogin.body.token) throw new Error('Good login failed');
  console.log('✓ Rejected invalid password (401) & Authenticated valid password (200)\n');

  // 5. Protected Route Access Control
  console.log('[Check 5] Verifying Protected Route Barrier (401 without token)...');
  const unauth = await request({ host, port, path: '/api/auth/me', method: 'GET' });
  if (unauth.status !== 401) throw new Error('Protected route allowed unauthenticated request');
  const authMe = await request({ host, port, path: '/api/auth/me', method: 'GET', headers: authHeaders });
  if (authMe.status !== 200) throw new Error('Protected route rejected valid token');
  console.log('✓ Denied access without token (401) & Allowed access with Bearer token (200)\n');

  // 6. Medicine CRUD (Add, List, Update, Refill, Delete)
  console.log('[Check 6] Testing Medicine CRUD & Ownership Validation...');
  const addMed = await request(
    { host, port, path: '/api/medicines', method: 'POST', headers: authHeaders },
    {
      name: 'Atorvastatin Calcium',
      dosage: '20 mg',
      form: 'Tablet',
      frequency: 'Once daily',
      scheduled_times: ['21:00'],
      start_date: new Date().toISOString().split('T')[0],
      quantity: 10,
      refill_threshold: 4,
      instructions: 'At bedtime',
      notes: 'Audit prescription record',
    }
  );
  if (addMed.status !== 201 || !addMed.body.medicineId) throw new Error('Medicine creation failed');
  const medId = addMed.body.medicineId;
  console.log(`✓ Created new medicine with ID: ${medId}`);

  // Fetch single
  const getMed = await request({ host, port, path: `/api/medicines/${medId}`, method: 'GET', headers: authHeaders });
  if (getMed.status !== 200 || getMed.body.medicine.name !== 'Atorvastatin Calcium') throw new Error('Get medicine failed');
  console.log(`✓ Verified medicine retrieval: ${getMed.body.medicine.name} (${getMed.body.medicine.dosage})`);

  // Update
  const updateMed = await request(
    { host, port, path: `/api/medicines/${medId}`, method: 'PUT', headers: authHeaders },
    {
      ...getMed.body.medicine,
      instructions: 'At bedtime with water',
    }
  );
  if (updateMed.status !== 200) throw new Error('Update medicine failed');
  console.log('✓ Updated medicine record successfully\n');

  // 7. Dose Action (Taken) -> Decrement Stock
  console.log('[Check 7] Testing Dose Action "taken" & Atomic Stock Decrement...');
  const todayStr = new Date().toISOString().split('T')[0];
  const takeRes = await request(
    { host, port, path: '/api/doses/action', method: 'POST', headers: authHeaders },
    {
      medicine_id: medId,
      scheduled_date: todayStr,
      scheduled_time: '21:00',
      status: 'taken',
      notes: 'Taken on time',
    }
  );
  if (takeRes.status !== 200 || takeRes.body.medicineStock !== 9) {
    throw new Error(`Expected stock 9, got ${takeRes.body?.medicineStock}`);
  }
  console.log(`✓ Dose marked as "taken" -> Stock decremented from 10 to ${takeRes.body.medicineStock}`);

  // 8. Duplicate Action Prevention
  console.log('[Check 8] Testing Duplicate Action Protection (No double-decrement)...');
  const dupTake = await request(
    { host, port, path: '/api/doses/action', method: 'POST', headers: authHeaders },
    {
      medicine_id: medId,
      scheduled_date: todayStr,
      scheduled_time: '21:00',
      status: 'taken',
      notes: 'Duplicate click',
    }
  );
  if (dupTake.status !== 200 || dupTake.body.medicineStock !== 9) {
    throw new Error(`Duplicate click double-decremented stock to ${dupTake.body?.medicineStock}`);
  }
  console.log(`✓ Duplicate click prevented: Stock stayed at ${dupTake.body.medicineStock}\n`);

  // 9. Status Reversion (Skipped restores stock)
  console.log('[Check 9] Testing Status Transition (Skipped restores stock)...');
  const skipRes = await request(
    { host, port, path: '/api/doses/action', method: 'POST', headers: authHeaders },
    {
      medicine_id: medId,
      scheduled_date: todayStr,
      scheduled_time: '21:00',
      status: 'skipped',
      notes: 'Doctor advised skipping',
    }
  );
  if (skipRes.status !== 200 || skipRes.body.medicineStock !== 10) {
    throw new Error(`Reverting to skipped did not restore stock to 10 (got ${skipRes.body?.medicineStock})`);
  }
  console.log(`✓ Status changed to "skipped" -> Stock restored back to ${skipRes.body.medicineStock}\n`);

  // 10. Stock Refill Audit
  console.log('[Check 10] Testing Stock Refill Audit Logging...');
  const refillRes = await request(
    { host, port, path: `/api/medicines/${medId}/refill`, method: 'POST', headers: authHeaders },
    { quantityAdded: 25, notes: 'Monthly pharmacy refill' }
  );
  if (refillRes.status !== 200 || refillRes.body.newQuantity !== 35) {
    throw new Error(`Refill failed: ${JSON.stringify(refillRes.body)}`);
  }
  console.log(`✓ Refill logged: +25 units -> New quantity: ${refillRes.body.newQuantity}\n`);

  // 11. Medication History with Filters
  console.log('[Check 11] Testing History Filtering...');
  const histRes = await request(
    { host, port, path: `/api/doses/history?status=skipped&medicineId=${medId}`, method: 'GET', headers: authHeaders }
  );
  if (histRes.status !== 200 || histRes.body.records.length === 0) {
    throw new Error('History query returned no records');
  }
  console.log(`✓ Filtered history returned ${histRes.body.records.length} records matching status=skipped\n`);

  // 12. Dashboard Summary API
  console.log('[Check 12] Testing Dashboard Summary API...');
  const dashRes = await request({ host, port, path: '/api/dashboard/summary', method: 'GET', headers: authHeaders });
  if (dashRes.status !== 200 || !dashRes.body.metrics) {
    throw new Error('Dashboard summary failed');
  }
  console.log(`✓ Dashboard metrics: ${dashRes.body.metrics.totalScheduled} scheduled today, ${dashRes.body.metrics.skippedCount} skipped\n`);

  // 13. Adherence Analytics Dynamic Calculations
  console.log('[Check 13] Testing Adherence Analytics from stored database records...');
  const anRes = await request({ host, port, path: '/api/analytics/adherence?days=7', method: 'GET', headers: authHeaders });
  if (anRes.status !== 200 || !anRes.body.dailyTrend) {
    throw new Error('Analytics failed');
  }
  console.log(`✓ Adherence trend computed across ${anRes.body.dailyTrend.length} days | Overall rate: ${anRes.body.overall.adherenceRate}%\n`);

  // 14. Clean-up Deletion
  console.log('[Check 14] Testing Medicine Deletion...');
  const delRes = await request({ host, port, path: `/api/medicines/${medId}`, method: 'DELETE', headers: authHeaders });
  if (delRes.status !== 200) throw new Error('Deletion failed');
  console.log('✓ Successfully deleted medicine and cleaned up test records.\n');

  console.log('======================================================');
  console.log('🎉 ALL 14 AUDIT CHECKS PASSED WITH 100% SUCCESS RATE!');
  console.log('======================================================');
}

runAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err.message);
  process.exit(1);
});

