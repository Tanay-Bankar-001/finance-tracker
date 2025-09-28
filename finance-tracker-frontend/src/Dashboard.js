import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import axios from 'axios';

const userId = '68d669f0d712f627d829c474';

const currentDate = new Date();
const initialMonth = currentDate.getMonth() + 1;
const initialYear = currentDate.getFullYear();

const initialFormState = {
  date: '',
  type: 'expense',
  mode: '',
  payee: '',
  expenseType: '',
  needsWants: '',
  amount: '',
  remarks: '',
  creditCardName: '',
  isCredirCardExpense: false
};

function Dashboard() {
  // State management (existing + new)
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  
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

  // Double-click delete states
  const [deleteClickCount, setDeleteClickCount] = useState({});
  const [deleteTimeouts, setDeleteTimeouts] = useState({});

  // Quick search states
  const [quickSearch, setQuickSearch] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [showQuickResults, setShowQuickResults] = useState(false);

  // Enhanced categories matching your CSV
  const [expenseTypes] = useState([
    "Food", "Essentials", "Travel", "Investment", "Entertainment", "Laundry", "Saved", "Fund Transfer"
  ]);
  
  const [needsWantsOptions] = useState([
    "Needs", "Wants", "Savings", "Invested", "Fund Transfer"
  ]);

  const [modes] = useState([
    "GPay UPI", "NEFT", "Cash", "Paytm UPI", "Mobikwik UPI", "Amazon Pay UPI", 
    "Coral GPay CC", "MMT Mastercard", "Coral Paytm CC", "Debit Card"
  ]);

  // Helper functions (existing ones)
  const getMonthYearString = (m, y) => `${y}-${m.toString().padStart(2, '0')}`;
  
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

  useEffect(() => {
    fetchSummary();
    fetchAccount();
  }, [month, year]);

  // Navigation functions (existing)
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

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  // Quick search function
  const handleQuickSearch = async (searchTerm) => {
    setQuickSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setQuickSearchResults([]);
      setShowQuickResults(false);
      return;
    }
    
    try {
      const params = new URLSearchParams({ search: searchTerm, limit: 5 });
      const res = await axios.get(`http://localhost:3000/api/transactions/search/${userId}?${params}`);
      setQuickSearchResults(res.data.transactions || []);
      setShowQuickResults(true);
    } catch (error) {
      console.error("Quick search error:", error);
      setQuickSearchResults([]);
    }
  };

  // Form handlers
  const handleAddFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm({ 
      ...addForm, 
      [name]: type === 'checkbox' ? checked : value 
    });
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
      const payload = { 
        ...addForm, 
        user: userId, 
        date: addForm.date ? new Date(addForm.date) : new Date(),
        amount: Number(addForm.amount)
      };
      await axios.post('http://localhost:3000/api/transactions/add', payload);
      await fetchSummary();
      await fetchAccount();
      setAddForm(initialFormState);
    } catch (error) {
      setAddError("Server error. Could not add transaction.");
    }
    setAddLoading(false);
  };

  // Edit/Delete handlers
  const handleEdit = (txn) => {
    setEditingId(txn._id);
    setEditForm({
      date: txn.date.slice(0,10),
      type: txn.type,
      mode: txn.mode || '',
      payee: txn.payee,
      expenseType: txn.expenseType || '',
      needsWants: txn.needsWants || '',
      amount: txn.amount,
      remarks: txn.remarks || ''
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleEditSave = async (id) => {
    try {
      const payload = { ...editForm, date: new Date(editForm.date), amount: Number(editForm.amount) };
      await axios.put(`http://localhost:3000/api/transactions/${id}`, payload);
      await fetchSummary();
      await fetchAccount();
      setEditingId(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // IMPROVED DELETE HANDLER - Double Click Confirmation
  const handleDelete = async (id) => {
    const currentCount = deleteClickCount[id] || 0;
    
    if (currentCount === 0) {
      setDeleteClickCount(prev => ({ ...prev, [id]: 1 }));
      const timeout = setTimeout(() => {
        setDeleteClickCount(prev => {
          const newCount = { ...prev };
          delete newCount[id];
          return newCount;
        });
        setDeleteTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      }, 3000);
      setDeleteTimeouts(prev => ({ ...prev, [id]: timeout }));
    } else {
      try {
        if (deleteTimeouts[id]) clearTimeout(deleteTimeouts[id]);
        await axios.delete(`http://localhost:3000/api/transactions/${id}`);
        await fetchSummary();
        await fetchAccount();
        setEditingId(null);
        setDeleteClickCount(prev => {
          const newCount = { ...prev };
          delete newCount[id];
          return newCount;
        });
        setDeleteTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[id];
          return newTimeouts;
        });
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const calculateCurrentBalance = () => {
    if (!account || !summary) return account?.currentBalance || 0;
    return account.startingBalance + summary.netFlow;
  };

  // Render goal progress bar
  const renderGoalProgress = (goal, label, color) => {
    const percentage = goal.target > 0 ? (goal.amount / goal.target) * 100 : 0;
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginBottom: '4px' }}>
          <span style={{ fontWeight: '500' }}>{label}</span>
          <span>₹{goal.amount} / ₹{goal.target.toFixed(0)} ({percentage.toFixed(1)}%)</span>
        </div>
        <div style={{ 
          width: '100%', 
          backgroundColor: '#e2e8f0', 
          borderRadius: '8px', 
          height: '8px',
          overflow: 'hidden'
        }}>
          <div 
            style={{ 
              width: `${Math.min(percentage, 100)}%`, 
              backgroundColor: color, 
              height: '100%', 
              borderRadius: '8px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) return (
    <div style={{ 
      textAlign: 'center', 
      padding: '50px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ 
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <div>Loading your data...</div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (!summary) return <div style={{ textAlign: 'center', padding: '50px' }}>No data.</div>;

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#f8fafc',
      minHeight: '100vh'
    }}>
      
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '25px',
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          color: '#1f2937',
          fontSize: '2.5em',
          fontWeight: '700'
        }}>
          💰 Budget Tracker
        </h1>
        <h2 style={{ 
          margin: '0', 
          color: '#6b7280',
          fontSize: '1.4em',
          fontWeight: '400'
        }}>
          {getMonthName(month)} {year}
        </h2>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '25px' }}>
        <button 
          onClick={goToPreviousMonth} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95em',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          ← Previous
        </button>
        <button 
          onClick={goToCurrentMonth} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95em',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          Current Month
        </button>
        <button 
          onClick={goToNextMonth} 
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.95em',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          Next →
        </button>
      </div>

      {/* Quick Search Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '25px',
        position: 'relative'
      }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
          <input
  type="text"
  className="search-input"
  placeholder="🔍 Quick search transactions... (payee, remarks, category)"
  value={quickSearch}
  onChange={(e) => handleQuickSearch(e.target.value)}
  onBlur={() => setTimeout(() => setShowQuickResults(false), 200)}
  onFocus={() => quickSearch.length >= 2 && setShowQuickResults(true)}
/>

          
          {/* Quick Search Results Dropdown */}
          {showQuickResults && quickSearchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              right: '0',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto',
              marginTop: '5px'
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', fontSize: '0.85em', color: '#6b7280', fontWeight: '500' }}>
                Recent matches ({quickSearchResults.length})
              </div>
              {quickSearchResults.map(txn => (
                <div 
                  key={txn._id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f9fafb',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => {
                    setQuickSearch('');
                    setShowQuickResults(false);
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                      {txn.payee}
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#6b7280' }}>
                      {new Date(txn.date).toLocaleDateString()} • {txn.expenseType || txn.type}
                      {txn.remarks && ` • ${txn.remarks.slice(0, 30)}${txn.remarks.length > 30 ? '...' : ''}`}
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: txn.type === 'income' ? '#10b981' : '#ef4444' 
                  }}>
                    ₹{txn.amount}
                  </div>
                </div>
              ))}
              <div style={{ 
                padding: '10px 16px', 
                textAlign: 'center',
                background: '#f8fafc',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
              }}>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-search', { detail: quickSearch }));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '0.85em',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  See all results in Advanced Search →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '25px'
      }}>
        {account && (
          <>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '4px' }}>Opening Balance</div>
              <div style={{ fontSize: '1.8em', fontWeight: '700', color: '#1f2937' }}>₹{account.startingBalance}</div>
            </div>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '4px' }}>Current Balance</div>
              <div style={{ fontSize: '1.8em', fontWeight: '700', color: '#1f2937' }}>₹{calculateCurrentBalance()}</div>
            </div>
          </>
        )}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #3b82f6'
        }}>
          <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '4px' }}>Total Income</div>
          <div style={{ fontSize: '1.8em', fontWeight: '700', color: '#1f2937' }}>₹{summary.totalIncome}</div>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '4px' }}>Total Expenses</div>
          <div style={{ fontSize: '1.8em', fontWeight: '700', color: '#1f2937' }}>₹{summary.totalExpenses}</div>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '4px' }}>Credit Card Bills</div>
          <div style={{ fontSize: '1.8em', fontWeight: '700', color: '#1f2937' }}>₹{summary.creditCardPayments}</div>
        </div>
      </div>

      {/* Add Transaction Form */}
      <div style={{ 
        marginBottom: '25px', 
        padding: '25px', 
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.25em' }}>
          Add New Transaction
        </h3>
        <form onSubmit={handleAddTransaction}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
            gap: '12px', 
            marginBottom: '20px' 
          }}>
            
            <input 
              type="date" 
              name="date" 
              value={addForm.date} 
              onChange={handleAddFormChange}
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            />
            
            <select 
              name="type" 
              value={addForm.type} 
              onChange={handleAddFormChange} 
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
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
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
              required
            />
            
            {addForm.type === 'expense' && (
              <select 
                name="expenseType" 
                value={addForm.expenseType} 
                onChange={handleAddFormChange} 
                style={{ 
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95em'
                }}
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
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
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
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
              required
            />
            
            {addForm.type === 'expense' && (
              <select 
                name="needsWants" 
                value={addForm.needsWants} 
                onChange={handleAddFormChange} 
                style={{ 
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.95em'
                }}
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
              style={{ 
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.95em'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={addLoading}
            style={{ 
              padding: '12px 24px',
              backgroundColor: addLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: addLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.95em',
              fontWeight: '500'
            }}
          >
            {addLoading ? "Adding..." : "Add Transaction"}
          </button>
          
          {addError && (
            <p style={{ 
              color: '#ef4444', 
              marginTop: '12px', 
              padding: '10px',
              background: '#fef2f2',
              borderRadius: '6px',
              fontSize: '0.9em'
            }}>
              {addError}
            </p>
          )}
        </form>
      </div>

      {/* Main Layout: Income Table | Expenses Table | Goals Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 300px', gap: '20px' }}>
        
        {/* Income Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '1.1em' }}>Income</h3>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '10px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>From</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Mode</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Remarks</th>
                  <th style={{ padding: '10px 8px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {summary.income?.map(txn => (
                  <tr key={txn._id}>
                    {editingId === txn._id ? (
                      // EDIT MODE
                      <>
                        <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                          <input type="date" name="date" value={editForm.date} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.8em', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                          <input name="payee" value={editForm.payee} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.8em', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                          <select name="mode" value={editForm.mode} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.8em', padding: '4px' }}>
                            <option value="">Mode</option>
                            {modes.map(mode => <option value={mode} key={mode}>{mode}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                          <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.8em', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e5e7eb' }}>
                          <input name="remarks" value={editForm.remarks} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.8em', padding: '4px' }} />
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button onClick={() => handleEditSave(txn._id)} style={{ marginRight: '3px', background: '#10b981', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7em' }}>Save</button>
                          <button onClick={handleEditCancel} style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7em' }}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      // VIEW MODE
                      <>
                        <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{txn.date.slice(0,10)}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{txn.payee}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{txn.mode}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>₹{txn.amount}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e7eb' }}>{txn.remarks}</td>
                        <td style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button onClick={() => handleEdit(txn)} style={{ marginRight: '3px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7em' }}>Edit</button>
                          <button 
                            onClick={() => handleDelete(txn._id)} 
                            style={{ 
                              background: deleteClickCount[txn._id] ? '#ef4444' : '#6b7280', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '3px', 
                              padding: '2px 6px', 
                              fontSize: '0.7em',
                              fontWeight: deleteClickCount[txn._id] ? 'bold' : 'normal'
                            }}
                          >
                            {deleteClickCount[txn._id] ? 'Confirm?' : 'Del'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {(!summary.income || summary.income.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No income transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table WITH ALL FEATURES */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '1.1em' }}>Expenses</h3>
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>To</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Mode</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>N/W</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Remarks</th>
                  <th style={{ padding: '8px 4px', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...(summary.expenses || []),
                  ...(summary.savings || []),
                  ...(summary.ccPayments || [])
                ]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(txn => (
                  <tr key={txn._id}>
                    {editingId === txn._id ? (
                      // EDIT MODE
                      <>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <input type="date" name="date" value={editForm.date} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }} />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <input name="payee" value={editForm.payee} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }} />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <select name="expenseType" value={editForm.expenseType} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }}>
                            <option value="">Type</option>
                            {expenseTypes.map(type => <option value={type} key={type}>{type}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <select name="mode" value={editForm.mode} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }}>
                            <option value="">Mode</option>
                            {modes.map(mode => <option value={mode} key={mode}>{mode}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <input type="number" name="amount" value={editForm.amount} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }} />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <select name="needsWants" value={editForm.needsWants} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }}>
                            <option value="">N/W</option>
                            {needsWantsOptions.map(option => <option value={option} key={option}>{option}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb' }}>
                          <input name="remarks" value={editForm.remarks} onChange={handleEditChange} style={{ width: '100%', fontSize: '0.7em', padding: '2px' }} />
                        </td>
                        <td style={{ padding: '4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button onClick={() => handleEditSave(txn._id)} style={{ marginRight: '2px', background: '#10b981', color: 'white', border: 'none', borderRadius: '2px', padding: '1px 4px', fontSize: '0.6em' }}>Save</button>
                          <button onClick={handleEditCancel} style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: '2px', padding: '1px 4px', fontSize: '0.6em' }}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      // VIEW MODE
                      <>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb' }}>{txn.date.slice(0,10)}</td>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb' }}>{txn.payee}</td>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb' }}>
                          {txn.expenseType || 
                           (txn.type === 'saved' ? 'Saved' : '') ||
                           (txn.type === 'credit_card_payment' ? 'CC Payment' : 'Expense')}
                        </td>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb' }}>{txn.mode}</td>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>₹{txn.amount}</td>
                        <td style={{ 
                          padding: '6px 4px', 
                          border: '1px solid #e5e7eb',
                          fontSize: '0.75em'
                        }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75em',
                            backgroundColor: 
                              txn.needsWants === 'Needs' ? '#dcfce7' : 
                              txn.needsWants === 'Wants' ? '#fef3c7' : 
                              txn.needsWants === 'Savings' || txn.type === 'saved' ? '#dbeafe' :
                              txn.needsWants === 'Invested' ? '#e0e7ff' :
                              txn.type === 'credit_card_payment' ? '#fed7aa' : '#f3f4f6'
                          }}>
                            {txn.needsWants || 
                             (txn.type === 'saved' ? 'Savings' : '') ||
                             (txn.type === 'credit_card_payment' ? 'CC Bill' : '—')}
                          </span>
                        </td>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb' }}>{txn.remarks}</td>
                        <td style={{ padding: '6px 4px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                          <button onClick={() => handleEdit(txn)} style={{ marginRight: '2px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '2px', padding: '1px 4px', fontSize: '0.6em' }}>Edit</button>
                          <button 
                            onClick={() => handleDelete(txn._id)} 
                            style={{ 
                              background: deleteClickCount[txn._id] ? '#ef4444' : '#6b7280', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '2px', 
                              padding: '1px 4px', 
                              fontSize: '0.6em',
                              fontWeight: deleteClickCount[txn._id] ? 'bold' : 'normal'
                            }}
                          >
                            {deleteClickCount[txn._id] ? 'Sure?' : 'Del'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {(!summary.expenses || summary.expenses.length === 0) && 
                 (!summary.savings || summary.savings.length === 0) && 
                 (!summary.ccPayments || summary.ccPayments.length === 0) && (
                  <tr>
                    <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No expense transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Goals Sidebar */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '1.1em' }}>Goals</h3>
          {summary.goalProgress && (
            <>
              {renderGoalProgress(summary.goalProgress.needs, 'Needs', '#10b981')}
              {renderGoalProgress(summary.goalProgress.wants, 'Wants', '#f59e0b')}
              {renderGoalProgress(summary.goalProgress.savings, 'Savings', '#3b82f6')}
              {renderGoalProgress(summary.goalProgress.invested, 'Invested', '#8b5cf6')}
            </>
          )}
          
          <hr style={{ margin: '20px 0', border: 'none', height: '1px', background: '#e5e7eb' }} />
          
          <h4 style={{ margin: '0 0 12px 0', color: '#4b5563', fontSize: '1em' }}>Category Breakdown</h4>
          {summary.expensesByType && Object.entries(summary.expensesByType).map(([type, amount]) => (
            <div key={type} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px',
              padding: '6px 8px',
              background: '#f9fafb',
              borderRadius: '4px',
              fontSize: '0.85em'
            }}>
              <span>{type}:</span>
              <span style={{ fontWeight: '600' }}>₹{amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
