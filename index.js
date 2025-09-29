// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI, {
  // These options no longer have any effect in v6 of the driver, but they're harmless
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas!'))
.catch((err) => console.error('MongoDB connection error:', err));

const creditCardRoutes = require("./routes/creditCardRoutes"); // top, with other routes
app.use("/api/creditcards", creditCardRoutes);                 // after other routes


// Setup Express server
const express = require('express');
const cors = require('cors');
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

// Add API routes
const transactionRoutes = require('./routes/transactionRoutes');
const accountRoutes = require('./routes/AccountRoutes');

app.use('/api/transactions', transactionRoutes);
app.use('/api/accounts', accountRoutes);

// Quick health check route
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
