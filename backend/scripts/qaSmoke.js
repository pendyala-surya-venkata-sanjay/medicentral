/**
 * Launch QA smoke checks — run with API up: npm run qa:smoke
 */
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BASE = process.env.QA_API_URL || 'http://localhost:5000';
const API = `${BASE}/api`;

const results = [];

const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.log(`✗ ${name}: ${err.message}`);
  }
};

const run = async () => {
  console.log(`QA smoke → ${BASE}\n`);

  await check('Health liveness', async () => {
    const { data } = await axios.get(`${BASE}/health`);
    if (data.status !== 'ok' && data.db !== 'connected') throw new Error('unhealthy');
  });

  await check('Health readiness', async () => {
    const { data } = await axios.get(`${BASE}/health/ready`);
    if (!data.ready) throw new Error('not ready');
  });

  let patientToken;
  await check('Patient login', async () => {
    const { data } = await axios.post(`${API}/auth/login`, {
      email: 'patient@demo.com',
      password: 'demo123',
    });
    if (!data.token) throw new Error('no token');
    patientToken = data.token;
  });

  await check('Patient cockpit', async () => {
    await axios.get(`${API}/patient-portal/cockpit`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
  });

  let staffToken;
  await check('Staff login', async () => {
    const { data } = await axios.post(`${API}/auth/login`, {
      email: 'staff@demo.com',
      password: 'demo123',
    });
    staffToken = data.token;
  });

  await check('Ops context', async () => {
    await axios.get(`${API}/ops/context`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
  });

  await check('Queue RECEPTION', async () => {
    await axios.get(`${API}/queues/RECEPTION`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
  });

  let adminToken;
  await check('Super admin login', async () => {
    const { data } = await axios.post(`${API}/auth/login`, {
      email: 'superadmin@demo.com',
      password: 'demo123',
    });
    adminToken = data.token;
  });

  await check('Platform overview', async () => {
    await axios.get(`${API}/intelligence/platform/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  await check('Auth boundary (no token)', async () => {
    try {
      await axios.get(`${API}/ops/context`);
      throw new Error('should have failed');
    } catch (e) {
      if (e.response?.status !== 401) throw e;
    }
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
};

run();
