import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'ホーム', icon: '🏠' },
    { path: '/input', label: '支出入力', icon: '➕' },
    { path: '/list', label: '支出リスト', icon: '📋' },
    { path: '/summary', label: '月次集計', icon: '📊' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">
          💰 家計簿アプリ
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