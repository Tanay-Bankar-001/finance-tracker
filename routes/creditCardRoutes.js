const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

const creditCardNames = [
  "Coral GPay CC",
  "MMT Mastercard",
  "Coral Paytm CC"
  // Add any new card "mode" value here as needed
];

// GET /api/creditcards/summary/:userId?month=9&year=2025
router.get("/summary/:userId", async (req, res) => {
  const { userId } = req.params;
  const { month, year } = req.query;
  const start = new Date(`${year}-${month}-01`);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  // Expenses on credit cards (type: 'expense' + card mode)
  const spent = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lte: end }, type: "expense", mode: { $in: creditCardNames } } },
    { $group: { _id: "$mode", totalSpent: { $sum: "$amount" } } }
  ]);

  // Repayments (type: 'credit_card_payment' + card mode)
  const repaid = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lte: end }, type: "credit_card_payment", mode: { $in: creditCardNames } } },
    { $group: { _id: "$mode", totalRepaid: { $sum: "$amount" } } }
  ]);

  // Combine for output
  const output = creditCardNames.map(card => {
    const spentFound = spent.find(s => s._id === card)?.totalSpent || 0;
    const repaidFound = repaid.find(r => r._id === card)?.totalRepaid || 0;
    return {
      card,
      totalSpent: spentFound,
      totalRepaid: repaidFound,
      balance: spentFound - repaidFound
    };
  });

  res.json({ cards: output });
});

module.exports = router;
