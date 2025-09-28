const express = require('express');
const router = express.Router();
const Account = require('../models/Account');

/* GET account for specific month */
router.get('/:userId/:monthYear', async (req, res) => {
  try {
    const { userId, monthYear } = req.params;
    
    let account = await Account.findOne({ 
      user: userId, 
      monthYear: monthYear 
    });
    
    // If no account exists for this month, create one
    if (!account) {
      account = new Account({
        user: userId,
        monthYear: monthYear,
        startingBalance: 0,
        currentBalance: 0
      });
      await account.save();
    }
    
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* UPDATE account balance */
router.put('/:userId/:monthYear', async (req, res) => {
  try {
    const { userId, monthYear } = req.params;
    const { startingBalance, currentBalance } = req.body;
    
    let account = await Account.findOneAndUpdate(
      { user: userId, monthYear: monthYear },
      { 
        startingBalance: startingBalance,
        currentBalance: currentBalance 
      },
      { new: true, upsert: true }
    );
    
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* UPDATE current balance only (after transactions) */
router.patch('/:userId/:monthYear/balance', async (req, res) => {
  try {
    const { userId, monthYear } = req.params;
    const { currentBalance } = req.body;
    
    const account = await Account.findOneAndUpdate(
      { user: userId, monthYear: monthYear },
      { currentBalance: currentBalance },
      { new: true }
    );
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;