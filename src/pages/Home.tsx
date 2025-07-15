import React from 'react';
import { Link } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import './Home.css';

const Home: React.FC = () => {
  const { state } = useExpense();

  // 今月の支出総額を計算
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthExpenses = state.expenses.filter(expense => 
    expense.date.startsWith(currentMonth)
  );
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 今週の支出を計算
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  startOfWeek.setHours(0, 0, 0, 0);
  endOfWeek.setHours(23, 59, 59, 999);

  const thisWeekExpenses = state.expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
  });
  const thisWeekTotal = thisWeekExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 今日の支出を計算
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const todayExpenses = state.expenses.filter(expense => expense.date === today);
  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const quickActions = [
    {
      title: '支出を記録',
      description: '今日の支出を素早く記録',
      link: '/daily',
      icon: '➕',
      color: '#FF6B6B'
    },
    {
      title: '支出を確認',
      description: '週の支出リストを確認・編集',
      link: '/weekly',
      icon: '📋',
      color: '#4ECDC4'
    },
    {
      title: '月次レポート',
      description: '月次の支出レポートを確認',
      link: '/monthly',
      icon: '📊',
      color: '#45B7D1'
    }
  ];

  return (
    <div className="home">
      <div className="home-container">
        <header className="home-header">
          <h1>家計簿ダッシュボード</h1>
          <p>支出を記録して、家計を管理しましょう</p>
        </header>

        <div className="summary-cards">
          <div className="summary-card today">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <h3>今日の支出</h3>
              <p className="summary-amount">¥{todayTotal.toLocaleString()}</p>
              <p className="summary-count">{todayExpenses.length}件</p>
            </div>
          </div>

          <div className="summary-card week">
            <div className="summary-icon">📝</div>
            <div className="summary-content">
              <h3>今週の支出</h3>
              <p className="summary-amount">¥{thisWeekTotal.toLocaleString()}</p>
              <p className="summary-count">{thisWeekExpenses.length}件</p>
            </div>
          </div>

          <div className="summary-card month">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <h3>今月の支出</h3>
              <p className="summary-amount">¥{currentMonthTotal.toLocaleString()}</p>
              <p className="summary-count">{currentMonthExpenses.length}件</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>クイックアクション</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="action-card">
                <div className="action-icon" style={{ backgroundColor: action.color }}>
                  {action.icon}
                </div>
                <div className="action-content">
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {state.expenses.length > 0 && (
          <div className="recent-expenses">
            <h2>最近の支出</h2>
            <div className="recent-list">
              {state.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((expense) => (
                  <div key={expense.id} className="recent-item">
                    <div className="recent-date">
                      {new Date(expense.date).toLocaleDateString('ja-JP')}
                    </div>
                    <div className="recent-description">{expense.description}</div>
                    <div className="recent-category">
                      {expense.category && (
                        <span className="category-tag">
                          {state.categories.find(c => c.id === expense.category)?.name || 'その他'}
                        </span>
                      )}
                    </div>
                    <div className="recent-amount">¥{expense.amount.toLocaleString()}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 