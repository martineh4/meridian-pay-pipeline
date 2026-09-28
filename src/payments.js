const { v4: uuidv4 } = require('uuid');

const payments = new Map();

function validatePayment(data) {
  const errors = [];
  if (!data.from) errors.push('from is required');
  if (!data.to) errors.push('to is required');
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('amount must be a positive number');
  }
  return errors;
}

function createPayment(from, to, amount) {
  const payment = {
    id: uuidv4(),
    from,
    to,
    amount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  payments.set(payment.id, payment);
  return payment;
}

function getPayment(id) {
  return payments.get(id) || null;
}

module.exports = { createPayment, getPayment, validatePayment };
