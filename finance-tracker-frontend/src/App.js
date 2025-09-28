import React, { useState } from 'react';
import Dashboard from './Dashboard';
import EnhancedSearch from './EnhancedSearch';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Navigation Bar */}
      <nav style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '15px 20px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              onClick={() => setCurrentView('dashboard')}
              style={{ 
                padding: '10px 20px', 
                background: currentView === 'dashboard' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white', 
                border: currentView === 'dashboard' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95em',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (currentView !== 'dashboard') {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                if (currentView !== 'dashboard') {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'transparent';
                }
              }}
            >
              📊 Dashboard
            </button>
            
            <button 
              onClick={() => setCurrentView('search')}
              style={{ 
                padding: '10px 20px', 
                background: currentView === 'search' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white', 
                border: currentView === 'search' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95em',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (currentView !== 'search') {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                if (currentView !== 'search') {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'transparent';
                }
              }}
            >
              🔍 Search
            </button>
          </div>

          <h1 style={{ 
            margin: '0', 
            color: 'white', 
            fontSize: '1.5em', 
            fontWeight: '700' 
          }}>
            💰 Finance Tracker
          </h1>
        </div>
      </nav>

      {/* Content */}
      <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 70px)' }}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'search' && <EnhancedSearch />}
      </div>
    </div>
  );
}

export default App;
