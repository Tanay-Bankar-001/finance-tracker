// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas!'))
.catch((err) => console.error('MongoDB connection error:', err));

// Setup Express server
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all requests
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Add API routes
const transactionRoutes = require('./routes/transactionRoutes');
const accountRoutes = require('./routes/accountRoutes'); // NEW LINE

app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes); // NEW LINE

// Quick health check route
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is running!');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
