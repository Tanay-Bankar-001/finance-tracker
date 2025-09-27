const express     = require('express');
const router      = express.Router();
const Transaction = require('../models/Transaction');

/* CREATE */
router.post('/add', async (req, res) => {
  try {
    const saved = await new Transaction(req.body).save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* READ all for a user */
router.get('/user/:userId', async (req, res) => {
  try {
    const txns = await Transaction.find({ user: req.params.userId });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ADVANCED SEARCH/FILTER */
router.get('/search/:userId', async (req, res) => {
  try {
    const { 
      search, category, type, mode, payee,
      startDate, endDate, minAmount, maxAmount 
    } = req.query;
    
    let query = { user: req.params.userId };
    
    // Text search across payee and remarks
    if (search) {
      query.$or = [
        { payee: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Exact matches
    if (category) query.category = category;
    if (type) query.type = type;
    if (mode) query.mode = mode;
    if (payee) query.payee = { $regex: payee, $options: 'i' };
    
    // Date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Amount range
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* MONTHLY SUMMARY */
router.get('/summary/:userId', async (req, res) => {
  try {
    const { month, year } = req.query;
    const data = await Transaction.getMonthlySummary(
      req.params.userId,
      Number(month),
      Number(year)
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE */
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

/* DELETE */
router.delete('/:transactionId', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.transactionId);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
