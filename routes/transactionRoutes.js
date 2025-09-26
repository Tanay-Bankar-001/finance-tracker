
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

//Export the Router
module.exports = router;
