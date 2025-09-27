const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    default: 'Primary Account' 
  },
  startingBalance: { 
    type: Number, 
    required: true,
    default: 0 
  },
  currentBalance: { 
    type: Number, 
    required: true,
    default: 0 
  },
  monthYear: { 
    type: String, 
    required: true // Format: "2025-09"
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// Ensure one account per user per month
accountSchema.index({ user: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('Account', accountSchema);
