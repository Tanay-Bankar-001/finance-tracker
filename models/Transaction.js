const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true // Every transaction needs an amount
  },
  date: {
    type: Date,
    default: Date.now // If not provided, use current date
  },
  type: {
    type: String,
    enum: ['expense', 'income', 'transfer', 'credit_card_payment'],
    required: true // Must be one of these types
  },
  category: {
    type: String // e.g., Food, Travel, etc. (optional for transfers)
  },
  remarks: {
    type: String // Any notes or description
  },
  payee: {
    type: String 
  },
  from: {
    type: String // for income
  },
  mode: { 
    type: String // Cash/UPI/NEFT/Card etc.
  },  
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount' // Reference to a bank account (for transfers/payments)
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BankAccount' // Reference to a bank account (for transfers/payments)
  },
  creditCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditCard' // Reference to a credit card (if used)
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Every transaction belongs to a user
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
