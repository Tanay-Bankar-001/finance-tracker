const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  date:      { type: Date,   default: Date.now },
  type: {
    type: String,
    enum: ['expense', 'income', 'transfer', 'credit_card_payment'],
    required: true
  },
  mode:      { type: String },                // Cash / UPI / Card / …
  payee:     { type: String, required: true },// "To / From" party
  category:  { type: String },
  remarks:   { type: String },

  /* optional bookkeeping fields */
  from:        { type: String },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  toAccount:   { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  creditCard:  { type: mongoose.Schema.Types.ObjectId, ref: 'CreditCard' },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

/* monthly aggregation WITH balance calculation */
transactionSchema.statics.getMonthlySummary = async function (userId, month, year) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const [totals] = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId),
                date: { $gte: start, $lte: end } } },
    { $group: {
        _id: null,
        inflow:  { $sum: { $cond:[{ $eq:['$type','income']  }, '$amount', 0] } },
        outflow: { $sum: { $cond:[{ $eq:['$type','expense'] }, '$amount', 0] } },
        ccpay:   { $sum: { $cond:[{ $eq:['$type','credit_card_payment'] }, '$amount', 0] } }
      } }
  ]);

  const transactions = await this.find({
    user: userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: -1 });

  return {
    inflow:   totals?.inflow  || 0,
    outflow:  totals?.outflow || 0,
    creditCardPayments: totals?.ccpay || 0,
    netFlow: (totals?.inflow || 0) - (totals?.outflow || 0), // Net change this month
    transactions
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
