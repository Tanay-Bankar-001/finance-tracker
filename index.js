//connecting mongoDB
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas!'))
.catch((err) => console.error('MongoDB connection error:', err));


const express = require('express'); //import express library
const app = express();  //create express app (server)

const transactionRoutes = require('./routes/transactionRoutes');
app.use(express.json()); // To parse JSON bodies
app.use('/api/transactions', transactionRoutes);


//check if server is active at http://localhost:3000/
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is running!');
});

//server listens requests on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


