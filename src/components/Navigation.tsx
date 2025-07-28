import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '◆' },
    { path: '/input', label: 'Input', icon: '＋' },
    { path: '/list', label: 'List', icon: '≡' },
    { path: '/summary', label: 'Summary', icon: '◈' },
    { path: '/meal-log', label: 'Meal Log', icon: '🍽' },
    { path: '/meal-prep-input', label: 'Meal Prep', icon: '🥘' },
    { path: '/meal-log-input', label: 'Meal Input', icon: '📝' },
    { path: '/meal-history', label: 'Meal History', icon: '📖' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">
          HOUSEHOLD LEDGER
        </h1>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation; 