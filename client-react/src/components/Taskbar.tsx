import React from 'react';
import logo from '../logo.png';

interface TaskbarProps {
  activeTab?: 'search' | 'pending' | 'history' | 'markets';
  onTabChange?: (tab: 'search' | 'pending' | 'history' | 'markets') => void;
}

export function Taskbar({ activeTab = undefined, onTabChange }: TaskbarProps) {
  const handleTabClick = (tab: 'search' | 'pending' | 'history' | 'markets') => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <nav className="taskbar">
      <div className="taskbar-logo">
        <img src={logo} alt="Dream Market Logo" />
        <span className="taskbar-title">Dream Market</span>
      </div>
      
      <div className="taskbar-nav">
        <button 
          className={`nav-item${activeTab === 'search' ? ' active' : ''}`}
          onClick={() => handleTabClick('search')}
        >
          <span className="nav-text">Search</span>
        </button>
        
        <button 
          className={`nav-item${activeTab === 'markets' ? ' active' : ''}`}
          onClick={() => handleTabClick('markets')}
        >
          <span className="nav-text">Markets</span>
        </button>
        
        <button 
          className={`nav-item${activeTab === 'pending' ? ' active' : ''}`}
          onClick={() => handleTabClick('pending')}
        >
          <span className="nav-text">Pending</span>
        </button>
        
        <button 
          className={`nav-item${activeTab === 'history' ? ' active' : ''}`}
          onClick={() => handleTabClick('history')}
        >
          <span className="nav-text">History</span>
        </button>
      </div>
      
      <div className="taskbar-actions">
        <div className="network-indicator">
          <span className="network-dot"></span>
        </div>
      </div>
    </nav>
  );
} 