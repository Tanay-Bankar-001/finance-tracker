const express = require('express'); //import express library
const app = express();  //create express app (server)

//check if server is active at http://localhost:3000/
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is running!');
});

//server listens requests on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


