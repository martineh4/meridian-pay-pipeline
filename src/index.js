const express = require('express');
const { createPayment, getPayment, validatePayment } = require('./payments');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'meridian-pay-api', version: '1.0.0' });
});

app.post('/payments', (req, res) => {
  const errors = validatePayment(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  const payment = createPayment(req.body.from, req.body.to, req.body.amount);
  res.status(201).json(payment);
});

app.get('/payments/:id', (req, res) => {
  const payment = getPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Meridian Pay API running on port ${PORT}`);
  });
}

module.exports = app;
