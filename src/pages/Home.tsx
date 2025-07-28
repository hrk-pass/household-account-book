import React from 'react';
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

  return (
    <div className="home">
      <div className="home-container">
        <header className="home-header">
          <h1>Household Expense Dashboard</h1>
          <p>Efficient household management for better financial planning</p>
        </header>

        <div className="summary-cards">
          <div className="summary-card today">
            <div className="summary-icon">●</div>
            <div className="summary-content">
              <h3>Today's Expenses</h3>
              <p className="summary-amount">¥{todayTotal.toLocaleString('en-US')}</p>
              <p className="summary-count">{todayExpenses.length} items</p>
            </div>
          </div>

          <div className="summary-card week">
            <div className="summary-icon">◆</div>
            <div className="summary-content">
              <h3>This Week's Expenses</h3>
              <p className="summary-amount">¥{thisWeekTotal.toLocaleString('en-US')}</p>
              <p className="summary-count">{thisWeekExpenses.length} items</p>
            </div>
          </div>

          <div className="summary-card month">
            <div className="summary-icon">◈</div>
            <div className="summary-content">
              <h3>This Month's Expenses</h3>
              <p className="summary-amount">¥{currentMonthTotal.toLocaleString('en-US')}</p>
              <p className="summary-count">{currentMonthExpenses.length} items</p>
            </div>
          </div>
        </div>

        {state.expenses.length > 0 && (
          <div className="recent-expenses">
            <h2>Recent Expenses</h2>
            <div className="recent-list">
              {state.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((expense) => (
                  <div key={expense.id} className="recent-item">
                    <div className="recent-date">
                      {new Date(expense.date).toLocaleDateString('en-US')}
                    </div>
                    <div className="recent-description">{expense.description}</div>
                    <div className="recent-category">
                      {expense.category && (
                        <span className="category-tag">
                          {state.categories.find(c => c.id === expense.category)?.name || 'Other'}
                        </span>
                      )}
                    </div>
                    <div className="recent-amount">¥{expense.amount.toLocaleString('en-US')}</div>
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