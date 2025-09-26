
//import Express and my Model
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

//Create POST Route
router.post('/add', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all transactions for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.params.userId });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Monthly summary for a user
router.get('/summary/:userId', async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.params.userId;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    });
    let inflow = 0, outflow = 0, creditCardPayments = 0;
    transactions.forEach(txn => {
      if (txn.type === 'income') inflow += txn.amount;
      if (txn.type === 'expense') outflow += txn.amount;
      if (txn.type === 'credit_card_payment') creditCardPayments += txn.amount;
    });
    res.json({
      transactions,
      inflow,
      outflow,
      creditCardPayments
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all transactions for a user (lifetime)
router.get('/all/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.params.userId });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a transaction by ID
router.put('/:transactionId', async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(
      req.params.transactionId,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a transaction by ID
router.delete('/:transactionId', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.transactionId);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


//Export the Router
module.exports = router;
