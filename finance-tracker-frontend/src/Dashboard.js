import React, { useEffect, useState } from 'react';
import axios from 'axios';

const userId = '68d669f0d712f627d829c474'; // Replace with your actual user ID
const month = 9;
const year = 2025;

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/transactions/summary/${userId}?month=${month}&year=${year}`)
      .then(res => {
        console.log(res.data);
        setSummary(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>No data found.</div>;

  return (
    <div>
      <h2>Monthly Summary</h2>
      <p><strong>Total Inflow:</strong> {summary.inflow}</p>
      <p><strong>Total Outflow:</strong> {summary.outflow}</p>
      <p><strong>Credit Card Payments:</strong> {summary.creditCardPayments}</p>
      <h3>Transactions</h3>
      <ul>
        {summary.transactions.map(txn => (
          <li key={txn._id}>
  {txn.date.slice(0,10)} | {txn.payee} | {txn.category} | {txn.amount} | {txn.type} | {txn.remarks} 
</li>

        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
