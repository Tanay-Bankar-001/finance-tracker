const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['expense', 'income', 'transfer', 'credit_card_payment', 'saved'],
    required: true
  },
  mode: { type: String }, // GPay UPI, NEFT, Cash, etc.
  payee: { type: String, required: true }, // "From" for income, "To" for expenses
  expenseType: { type: String }, // Food, Essentials, Travel, Investment, etc.
  needsWants: { 
    type: String,
    enum: ['Needs', 'Wants', 'Savings', 'Invested', 'Fund Transfer', '']
  },
  category: { type: String }, // For compatibility
  remarks: { type: String },

  // Credit card tracking
  creditCardName: { type: String }, // e.g. "Coral GPay CC"
  isCredirCardExpense: { type: Boolean, default: false },

  // Optional bookkeeping
  from: { type: String },
  fromAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  toAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  creditCard: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditCard' },

  // User reference - required
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

/* Monthly summary calculation */
transactionSchema.statics.getMonthlySummary = async function (userId, month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  // Get all transactions for the month
  const transactions = await this.find({
    user: userId,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  // Calculate totals
  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const savings = transactions.filter(t => t.type === 'saved');
  const ccPayments = transactions.filter(t => t.type === 'credit_card_payment');

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = savings.reduce((sum, t) => sum + t.amount, 0);
  const totalCCPayments = ccPayments.reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown - ONLY from expenses, don't double count
  const expensesByType = {};
  const expensesByNeedsWants = { 'Needs': 0, 'Wants': 0, 'Savings': 0, 'Invested': 0 };

  expenses.forEach(t => {
    if (t.expenseType) {
      expensesByType[t.expenseType] = (expensesByType[t.expenseType] || 0) + t.amount;
    }
    if (t.needsWants && expensesByNeedsWants.hasOwnProperty(t.needsWants)) {
      expensesByNeedsWants[t.needsWants] += t.amount;
    }
  });

  // Add savings transactions to 'Savings' category (but don't double count investments)
  expensesByNeedsWants.Savings += totalSavings;

  // DON'T add investments twice - they're already counted in expenses with needsWants: 'Invested'

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    totalInvestments: expensesByNeedsWants.Invested,
    creditCardPayments: totalCCPayments,
    netFlow: totalIncome - totalExpenses,
    income,
    expenses,
    savings,
    ccPayments,
    expensesByType,
    expensesByNeedsWants,
    goalProgress: {
      needs: { amount: expensesByNeedsWants.Needs, target: totalIncome * 0.40 },
      wants: { amount: expensesByNeedsWants.Wants, target: totalIncome * 0.20 },
      savings: { amount: expensesByNeedsWants.Savings, target: totalIncome * 0.10 },
      invested: { amount: expensesByNeedsWants.Invested, target: totalIncome * 0.30 }
    }
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
