import React, { useEffect, useState } from 'react';
import axios from 'axios';

const userId = '68d669f0d712f627d829c474';

// Get current month/year as default
const currentDate = new Date();
const initialMonth = currentDate.getMonth() + 1;
const initialYear = currentDate.getFullYear();

const initialFormState = {
  date: '',
  type: 'expense',
  mode: '',
  payee: '',
  category: '',
  amount: '',
  remarks: ''
};

function Dashboard() {
  // Month/Year state
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  
  // Account balance state
  const [account, setAccount] = useState(null);
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceForm, setBalanceForm] = useState({
    startingBalance: 0,
    currentBalance: 0
  });
  
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [addForm, setAddForm] = useState(initialFormState);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: '', type: '', mode: '', payee: '',
    startDate: '', endDate: '', minAmount: '', maxAmount: ''
  });
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [categories, setCategories] = useState([
    "Food", "Essentials", "Travel", "Investment", "Fund Transfer", "Laundry"
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [modes, setModes] = useState([
    "UPI", "Cash", "Debit Card", "Credit Card", "NetBanking", "Wallet", "Other"
  ]);
  const [newMode, setNewMode] = useState("");

  // Helper function to format month-year
  const getMonthYearString = (m, y) => `${y}-${m.toString().padStart(2, '0')}`;

  // Function to fetch account balance
  const fetchAccount = async (selectedMonth = month, selectedYear = year) => {
    try {
      const monthYear = getMonthYearString(selectedMonth, selectedYear);
      const res = await axios.get(`http://localhost:3000/api/accounts/${userId}/${monthYear}`);
      setAccount(res.data);
      setBalanceForm({
        startingBalance: res.data.startingBalance,
        currentBalance: res.data.currentBalance
      });
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  };

  // Function to fetch summary
  const fetchSummary = async (selectedMonth = month, selectedYear = year) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/transactions/summary/${userId}?month=${selectedMonth}&year=${selectedYear}`
      );
      setSummary(res.data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
    setLoading(false);
  };

  // Load data when component mounts or month/year changes
  useEffect(() => {
    fetchSummary();
    fetchAccount();
    setFilteredTransactions([]);
  }, [month, year]);

  // Month/Year Navigation Functions
  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  };

  // Balance management functions
  const handleBalanceEdit = () => {
    setEditingBalance(true);
  };

  const handleBalanceSave = async () => {
    try {
      const monthYear = getMonthYearString(month, year);
      const res = await axios.put(`http://localhost:3000/api/accounts/${userId}/${monthYear}`, balanceForm);
      setAccount(res.data);
      setEditingBalance(false);
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };

  const handleBalanceCancel = () => {
    setBalanceForm({
      startingBalance: account.startingBalance,
      currentBalance: account.currentBalance
    });
    setEditingBalance(false);
  };

  // Auto-calculate current balance based on transactions
  const calculateCurrentBalance = () => {
    if (!account || !summary) return account?.currentBalance || 0;
    
    const netChange = summary.inflow - summary.outflow;
    return account.startingBalance + netChange;
  };

  // Get month name for display
  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  const handleAddFormChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddNewCategory = () => {
    if(newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setAddForm({ ...addForm, category: newCategory });
      setEditForm(editingId ? { ...editForm, category: newCategory } : editForm);
      setNewCategory("");
    }
  };

  const handleAddNewMode = () => {
    if(newMode && !modes.includes(newMode)) {
      setModes([...modes, newMode]);
      setAddForm({ ...addForm, mode: newMode });
      setEditForm(editingId ? { ...editForm, mode: newMode } : editForm);
      setNewMode("");
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.payee || !addForm.amount || !addForm.type) {
      setAddError("Payee, Type, and Amount are required.");
      return;
    }
    setAddLoading(true);
    try {
      const payload = { ...addForm, user: userId, date: addForm.date ? new Date(addForm.date) : new Date() };
      await axios.post('http://localhost:3000/api/transactions/add', payload);
      await fetchSummary();
      await fetchAccount();
      setAddForm(initialFormState);
    } catch (error) {
      setAddError("Server error. Could not add transaction.");
    }
    setAddLoading(false);
  };

  // Search Functions
  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const res = await axios.get(
        `http://localhost:3000/api/transactions/search/${userId}?${params}`
      );
      setFilteredTransactions(res.data);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilters({
      category: '', type: '', mode: '', payee: '',
      startDate: '', endDate: '', minAmount: '', maxAmount: ''
    });
    setFilteredTransactions([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await axios.delete(`http://localhost:3000/api/transactions/${id}`);
    await fetchSummary();
    await fetchAccount();
    setEditingId(null);
    if (filteredTransactions.length > 0) {
      setFilteredTransactions([]);
    }
  };

  const handleEdit = (txn) => {
    setEditingId(txn._id);
    setEditForm({
      date: txn.date.slice(0,10),
      type: txn.type,
      mode: txn.mode || '',
      payee: txn.payee,
      category: txn.category || '',
      amount: txn.amount,
      remarks: txn.remarks || ''
    });
    setNewCategory("");
    setNewMode("");
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSave = async (id) => {
    const payload = { ...editForm, date: new Date(editForm.date) };
    await axios.put(`http://localhost:3000/api/transactions/${id}`, payload);
    await fetchSummary();
    await fetchAccount();
    setEditingId(null);
    if (filteredTransactions.length > 0) {
      setFilteredTransactions([]);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading…</div>;
  if (!summary) return <div style={{ textAlign: 'center', padding: '50px' }}>No data.</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* Month/Year Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <button 
          onClick={goToPreviousMonth}
          style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ← Previous
        </button>
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0', color: '#333' }}>
            {getMonthName(month)} {year}
          </h2>
          <small style={{ color: '#666' }}>
            {month === initialMonth && year === initialYear ? '(Current Month)' : ''}
          </small>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={goToCurrentMonth}
            style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Today
          </button>
          <button 
            onClick={goToNextMonth}
            style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Account Balance Section */}
      {account && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Primary Account Balance</h3>
          {editingBalance ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label>
                Starting Balance: ₹
                <input 
                  type="number" 
                  value={balanceForm.startingBalance}
                  onChange={(e) => setBalanceForm({...balanceForm, startingBalance: Number(e.target.value)})}
                  style={{ width: '100px', marginLeft: '5px' }}
                />
              </label>
              <label>
                Current Balance: ₹
                <input 
                  type="number" 
                  value={balanceForm.currentBalance}
                  onChange={(e) => setBalanceForm({...balanceForm, currentBalance: Number(e.target.value)})}
                  style={{ width: '100px', marginLeft: '5px' }}
                />
              </label>
              <button onClick={handleBalanceSave} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}>Save</button>
              <button onClick={handleBalanceCancel} style={{ padding: '5px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px' }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#fff', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                <strong>Starting Balance:</strong> ₹{account.startingBalance}
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#fff', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                <strong>Current Balance:</strong> ₹{account.currentBalance}
              </div>
              <div style={{ padding: '8px 12px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
                <strong>Calculated Balance:</strong> ₹{calculateCurrentBalance()}
                <small style={{ display: 'block', fontSize: '0.8em', color: '#666' }}>
                  (Starting + Net Flow)
                </small>
              </div>
              <button onClick={handleBalanceEdit} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}>Edit Balance</button>
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ padding: '10px 15px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
          <strong>Total Inflow:</strong> ₹{summary.inflow}
        </div>
        <div style={{ padding: '10px 15px', backgroundColor: '#f8d7da', borderRadius: '5px' }}>
          <strong>Total Outflow:</strong> ₹{summary.outflow}
        </div>
        <div style={{ padding: '10px 15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
          <strong>Credit Card Payments:</strong> ₹{summary.creditCardPayments}
        </div>
        <div style={{ 
          padding: '10px 15px', 
          backgroundColor: summary.inflow - summary.outflow >= 0 ? '#d1ecf1' : '#f5c6cb', 
          borderRadius: '5px' 
        }}>
          <strong>Net Change:</strong> ₹{summary.inflow - summary.outflow}
        </div>
      </div>

      <h3>Add Transaction</h3>
      <form onSubmit={handleAddTransaction} style={{ marginBottom: '20px' }}>
        <input type="date" name="date" value={addForm.date} onChange={handleAddFormChange} style={{width:120}} />
        <select name="type" value={addForm.type} onChange={handleAddFormChange} style={{width:90}}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
          <option value="credit_card_payment">Credit Card Payment</option>
        </select>
        <select
          name="mode"
          value={addForm.mode}
          onChange={handleAddFormChange}
          style={{width:90}}
        >
          <option value="">Mode</option>
          {modes.map(mode => (
            <option value={mode} key={mode}>{mode}</option>
          ))}
          <option value="__add_new__">Add new mode…</option>
        </select>
        {addForm.mode === "__add_new__" && (
          <span>
            <input
              type="text"
              placeholder="New mode"
              value={newMode}
              onChange={e => setNewMode(e.target.value)}
              style={{width:90}}
            />
            <button type="button" onClick={handleAddNewMode}>Add</button>
          </span>
        )}

        <input name="payee" placeholder="Payee" value={addForm.payee} onChange={handleAddFormChange} style={{width:100}} />

        <select
          name="category"
          value={addForm.category}
          onChange={handleAddFormChange}
          style={{width:100}}
        >
          <option value="">Category</option>
          {categories.map(cat => (
            <option value={cat} key={cat}>{cat}</option>
          ))}
          <option value="__add_new__">Add new category…</option>
        </select>
        {addForm.category === "__add_new__" && (
          <span>
            <input
              type="text"
              placeholder="New category"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              style={{width:100}}
            />
            <button type="button" onClick={handleAddNewCategory}>Add</button>
          </span>
        )}

        <input type="number" name="amount" placeholder="Amount" value={addForm.amount} onChange={handleAddFormChange} style={{width:60}} />
        <input name="remarks" placeholder="Remarks" value={addForm.remarks} onChange={handleAddFormChange} style={{width:120}} />
        <button type="submit" disabled={addLoading}>{addLoading ? "Adding..." : "Add"}</button>
      </form>
      {addError && <p style={{color:'red'}}>{addError}</p>}

      {/* Search & Filter Section */}
      <h3>Search Transactions (All Time)</h3>
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="Search payee or remarks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '200px', marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleSearch} style={{ marginRight: '10px', padding: '5px 10px' }}>Search</button>
          <button onClick={clearSearch} style={{ marginRight: '10px', padding: '5px 10px' }}>Clear</button>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            style={{ padding: '5px 10px' }}
          >
            {showFilters ? 'Hide Filters' : 'More Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
            <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} style={{ padding: '5px' }}>
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
              <option value="credit_card_payment">CC Payment</option>
            </select>
            
            <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} style={{ padding: '5px' }}>
              <option value="">All Categories</option>
              {categories.map(cat => <option value={cat} key={cat}>{cat}</option>)}
            </select>
            
            <select value={filters.mode} onChange={(e) => setFilters({...filters, mode: e.target.value})} style={{ padding: '5px' }}>
              <option value="">All Modes</option>
              {modes.map(mode => <option value={mode} key={mode}>{mode}</option>)}
            </select>
            
            <input 
              type="text" 
              placeholder="Payee contains..."
              value={filters.payee}
              onChange={(e) => setFilters({...filters, payee: e.target.value})}
              style={{ padding: '5px' }}
            />
            
            <input 
              type="date" 
              placeholder="Start Date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              style={{ padding: '5px' }}
            />
            
            <input 
              type="date" 
              placeholder="End Date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              style={{ padding: '5px' }}
            />
            
            <input 
              type="number" 
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
              style={{ padding: '5px' }}
            />
            
            <input 
              type="number" 
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
              style={{ padding: '5px' }}
            />
          </div>
        )}
      </div>

      <h3>
        {filteredTransactions.length > 0 ? (
          <span>
            Search Results ({filteredTransactions.length} transactions)
          </span>
        ) : (
          <span>
            Transactions for {getMonthName(month)} {year} ({summary.transactions.length} transactions)
          </span>
        )}
      </h3>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(filteredTransactions.length > 0 ? filteredTransactions : summary.transactions).map(txn => (
          <li key={txn._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
            {editingId === txn._id ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <input type="date" name="date" value={editForm.date} onChange={handleEditChange} style={{width:120}}/>
                <select name="type" value={editForm.type} onChange={handleEditChange} style={{width:80}}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                  <option value="credit_card_payment">CC Payment</option>
                </select>
                <select name="mode" value={editForm.mode} onChange={handleEditChange} style={{width:90}}>
                    <option value="">Mode</option>
                    {modes.map(mode => (
                      <option value={mode} key={mode}>{mode}</option>
                    ))}
                    <option value="__add_new__">Add new mode…</option>
                  </select>
                  {editForm.mode === "__add_new__" && (
                    <span>
                      <input
                        type="text"
                        placeholder="New mode"
                        value={newMode}
                        onChange={e => setNewMode(e.target.value)}
                        style={{width:90}}
                      />
                      <button type="button" onClick={handleAddNewMode}>Add</button>
                    </span>
                  )}
                <input name="payee" value={editForm.payee} onChange={handleEditChange} style={{width:100}}/>
                <select name="category" value={editForm.category} onChange={handleEditChange} style={{width:80}}>
                    <option value="">Category</option>
                    {categories.map(cat => (
                      <option value={cat} key={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__">Add new category…</option>
                  </select>
                  {editForm.category === "__add_new__" && (
                    <span>
                      <input
                        type="text"
                        placeholder="New category"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        style={{width:100}}
                      />
                      <button type="button" onClick={handleAddNewCategory}>Add</button>
                    </span>
                  )}
                <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} style={{width:60}}/>
                <input name="remarks" value={editForm.remarks} onChange={handleEditChange} style={{width:120}}/>
                <button onClick={() => handleEditSave(txn._id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px' }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 10px' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ flex: 1 }}>
                  <strong>{txn.date.slice(0,10)}</strong> | 
                  <span style={{ color: txn.type === 'expense' ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                    {txn.type}
                  </span> | 
                  {txn.mode || '—'} | 
                  {txn.payee} | 
                  {txn.category || '—'} | 
                  <strong>₹{txn.amount}</strong> | 
                  {txn.remarks || '—'}
                </span>
                <span>
                  <button 
                    onClick={() => handleEdit(txn)} 
                    style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '3px 8px', marginRight: '5px' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(txn._id)} 
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '3px 8px' }}
                  >
                    Delete
                  </button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      
      {(filteredTransactions.length > 0 ? filteredTransactions : summary.transactions).length === 0 && (
        <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
          No transactions found for {getMonthName(month)} {year}.
        </p>
      )}
    </div>
  );
}

export default Dashboard;
