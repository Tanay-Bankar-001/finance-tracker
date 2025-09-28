import React from 'react';

function TransactionForm({ 
  addForm, 
  handleAddFormChange, 
  handleAddTransaction, 
  addLoading, 
  addError,
  expenseTypes,
  modes,
  needsWantsOptions
}) {
  return (
    <div className="form-container">
      <h3 className="form-title">Add New Transaction</h3>
      <form onSubmit={handleAddTransaction}>
        <div className="form-grid">
          <input 
            type="date" 
            name="date" 
            value={addForm.date} 
            onChange={handleAddFormChange}
            className="form-input"
          />
          
          <select 
            name="type" 
            value={addForm.type} 
            onChange={handleAddFormChange} 
            className="form-select"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="saved">Saved</option>
            <option value="credit_card_payment">Credit Card Payment</option>
          </select>
          
          <input 
            name="payee" 
            placeholder={addForm.type === 'income' ? 'From (who paid)' : 'To (who received)'} 
            value={addForm.payee} 
            onChange={handleAddFormChange}
            className="form-input"
            required
          />
          
          {addForm.type === 'expense' && (
            <select 
              name="expenseType" 
              value={addForm.expenseType} 
              onChange={handleAddFormChange} 
              className="form-select"
            >
              <option value="">Expense Type</option>
              {expenseTypes.map(type => (
                <option value={type} key={type}>{type}</option>
              ))}
            </select>
          )}
          
          <select 
            name="mode" 
            value={addForm.mode} 
            onChange={handleAddFormChange} 
            className="form-select"
          >
            <option value="">Payment Mode</option>
            {modes.map(mode => (
              <option value={mode} key={mode}>{mode}</option>
            ))}
          </select>
          
          <input 
            type="number" 
            name="amount" 
            placeholder="Amount" 
            value={addForm.amount} 
            onChange={handleAddFormChange}
            className="form-input"
            required
          />
          
          {addForm.type === 'expense' && (
            <select 
              name="needsWants" 
              value={addForm.needsWants} 
              onChange={handleAddFormChange} 
              className="form-select"
            >
              <option value="">Needs/Wants</option>
              {needsWantsOptions.map(option => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          )}
          
          <input 
            name="remarks" 
            placeholder="Remarks" 
            value={addForm.remarks} 
            onChange={handleAddFormChange}
            className="form-input"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={addLoading}
          className={`form-button ${addLoading ? 'disabled' : 'primary'}`}
        >
          {addLoading ? "Adding..." : "Add Transaction"}
        </button>
        
        {addError && (
          <p className="form-error">{addError}</p>
        )}
      </form>
    </div>
  );
}

export default TransactionForm;
