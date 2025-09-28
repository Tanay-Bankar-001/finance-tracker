import React from 'react';

function SummaryCards({ account, summary, calculateCurrentBalance }) {
  return (
    <div className="summary-grid">
      {account && (
        <>
          <div className="summary-card purple">
            <div className="summary-label">Opening Balance</div>
            <div className="summary-value">₹{account.startingBalance}</div>
          </div>
          <div className="summary-card green">
            <div className="summary-label">Current Balance</div>
            <div className="summary-value">₹{calculateCurrentBalance()}</div>
          </div>
        </>
      )}
      <div className="summary-card blue">
        <div className="summary-label">Total Income</div>
        <div className="summary-value">₹{summary.totalIncome}</div>
      </div>
      <div className="summary-card red">
        <div className="summary-label">Total Expenses</div>
        <div className="summary-value">₹{summary.totalExpenses}</div>
      </div>
      <div className="summary-card orange">
        <div className="summary-label">Credit Card Bills</div>
        <div className="summary-value">₹{summary.creditCardPayments}</div>
      </div>
    </div>
  );
}

export default SummaryCards;
