const request = require('supertest');
const app = require('./index');

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('meridian-pay-api');
  });
});

describe('POST /payments', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/payments').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ from: 'alice', to: 'bob', amount: -5 });
    expect(res.statusCode).toBe(400);
  });

  it('creates a payment with valid data', async () => {
    const res = await request(app)
      .post('/payments')
      .send({ from: 'alice', to: 'bob', amount: 100 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('pending');
    expect(res.body.from).toBe('alice');
    expect(res.body.to).toBe('bob');
    expect(res.body.amount).toBe(100);
  });
});

describe('GET /payments/:id', () => {
  it('returns 404 for unknown payment id', async () => {
    const res = await request(app).get('/payments/nonexistent-id');
    expect(res.statusCode).toBe(404);
  });

  it('returns the payment for a known id', async () => {
    const createRes = await request(app)
      .post('/payments')
      .send({ from: 'carol', to: 'dave', amount: 250 });
    const id = createRes.body.id;
    const res = await request(app).get(`/payments/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(id);
  });
});
