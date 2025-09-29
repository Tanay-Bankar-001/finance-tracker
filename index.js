// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Setup Express server
const app = express();

// Enable CORS for local dev and Vercel deploy
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://finance-tracker-iota-puce.vercel.app"
  ],
  credentials: true
}));

// Enable JSON body parsing
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas!'))
.catch((err) => console.error('MongoDB connection error:', err));

// Add API routes
const transactionRoutes = require('./routes/transactionRoutes');
const accountRoutes = require('./routes/AccountRoutes');
const creditCardRoutes = require('./routes/creditCardRoutes');

app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes); 
app.use('/api/creditcards', creditCardRoutes); // Must come after app is initialized

// Quick health check route
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
