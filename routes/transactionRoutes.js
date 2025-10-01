const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Transaction = require('../models/Transaction');

/* CREATE */
router.post('/add', async (req, res) => {
  try {
    // LOG request body for debugging every POST
    console.log("POST /add req.body:", req.body);

    // Convert user field to ObjectId if needed
    if (req.body.user && typeof req.body.user === "string" && mongoose.Types.ObjectId.isValid(req.body.user)) {
      req.body.user = new mongoose.Types.ObjectId(req.body.user);
    }

    // Always set a valid date, fallback to current
    if (!req.body.date || isNaN(new Date(req.body.date).getTime())) {
      req.body.date = new Date();
    }

    // Create and save
    const saved = await new Transaction(req.body).save();
    // Log successful save
    console.log("Saved transaction:", saved);

    res.status(201).json(saved);
  } catch (err) {
    // LOG errors for diagnostics
    console.error("Add transaction error:", err);
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

/* ENHANCED GLOBAL SEARCH WITH ADVANCED FILTERS */
router.get('/search/:userId', async (req, res) => {
  try {
    const { 
      search, category, expenseType, type, mode, payee,
      startDate, endDate, minAmount, maxAmount,
      needsWants, limit = 100
    } = req.query;

    let query = { user: req.params.userId };

    if (search && search.trim()) {
      query.$or = [
        { payee: { $regex: search.trim(), $options: 'i' } },
        { remarks: { $regex: search.trim(), $options: 'i' } },
        { expenseType: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (expenseType) query.expenseType = expenseType;
    if (type) query.type = type;
    if (mode) query.mode = { $regex: mode, $options: 'i' };
    if (payee && !search) query.payee = { $regex: payee, $options: 'i' };
    if (needsWants) query.needsWants = needsWants;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.date.$lte = endDateTime;
      }
    }

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }

    const transactions = await Transaction
      .find(query)
      .sort({ date: -1 })
      .limit(Number(limit));

    const totalExpenses = transactions.reduce((sum, t) => 
      sum + (t.type === 'expense' || t.type === 'saved' || t.type === 'credit_card_payment' ? t.amount : 0), 0);

    const totalIncome = transactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : 0), 0);

    // Category breakdown
    const categoryBreakdown = {};
    const typeBreakdown = {};

    transactions.forEach(t => {
      if (t.expenseType) {
        categoryBreakdown[t.expenseType] = (categoryBreakdown[t.expenseType] || 0) + t.amount;
      }
      typeBreakdown[t.type] = (typeBreakdown[t.type] || 0) + t.amount;
    });

    res.json({
      transactions,
      count: transactions.length,
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      categoryBreakdown,
      typeBreakdown,
      searchQuery: req.query,
      dateRange: {
        earliest: transactions.length ? transactions[transactions.length - 1].date : null,
        latest: transactions.length ? transactions[0].date : null
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* QUICK FILTER: Recent transactions */
router.get('/recent/:userId', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const transactions = await Transaction
      .find({
        user: req.params.userId,
        date: { $gte: startDate }
      })
      .sort({ date: -1 })
      .limit(50);

    const totalExpenses = transactions.reduce((sum, t) => 
      sum + (t.type === 'expense' || t.type === 'saved' || t.type === 'credit_card_payment' ? t.amount : 0), 0);

    const totalIncome = transactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : 0), 0);

    res.json({
      transactions,
      count: transactions.length,
      totalExpenses,
      totalIncome,
      period: `Last ${days} days`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* QUICK FILTER: Category search */
router.get('/category/:userId/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await Transaction
      .find({
        user: req.params.userId,
        $or: [
          { category: category },
          { expenseType: category },
          { needsWants: category }
        ]
      })
      .sort({ date: -1 })
      .limit(Number(limit));

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      transactions,
      count: transactions.length,
      totalAmount,
      category: category
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SEARCH SUGGESTIONS: Get unique values for autocomplete */
router.get('/suggestions/:userId', async (req, res) => {
  try {
    const { field } = req.query; // payee, expenseType, mode, etc.

    let pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(req.params.userId) } }
    ];

    if (field === 'payee') {
      pipeline.push(
        { $group: { _id: '$payee', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      );
    } else if (field === 'expenseType') {
      pipeline.push(
        { $group: { _id: '$expenseType', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      );
    } else if (field === 'mode') {
      pipeline.push(
        { $group: { _id: '$mode', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: 15 }
      );
    }

    const results = await Transaction.aggregate(pipeline);
    const suggestions = results.map(r => r._id).filter(Boolean);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ANALYTICS: Spending trends */
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    const pipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.params.userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    const trends = await Transaction.aggregate(pipeline);

    // Category-wise spending
    const categoryPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.params.userId),
          type: { $in: ['expense', 'saved', 'credit_card_payment'] },
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$expenseType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ];

    const categorySpending = await Transaction.aggregate(categoryPipeline);

    res.json({
      trends,
      categorySpending,
      period: `Last ${months} months`
    });
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
