import React from "react";

function CreditCardSummary({ cards }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="table-container">
      <h3 className="table-title">Credit Card Tracker</h3>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Card</th>
              <th>Total Spent</th>
              <th>Total Repaid</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {cards.map(card => (
              <tr key={card.card}>
                <td>{card.card}</td>
                <td>₹{card.totalSpent}</td>
                <td>₹{card.totalRepaid}</td>
                <td style={{color: card.balance === 0 ? 'green' : 'orange', fontWeight: 'bold'}}>
                  ₹{card.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CreditCardSummary;
