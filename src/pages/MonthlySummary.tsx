import React, { useState, useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import type { MonthlySummary } from '../types';
import './MonthlySummary.css';

const MonthlySummaryPage: React.FC = () => {
  const { state } = useExpense();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = 今月, -1 = 先月, 1 = 来月

  // 選択された月の年月を取得
  const getMonthInfo = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    
    return {
      year,
      month,
      monthStr,
      displayName: getMonthName(offset),
      firstDay: new Date(year, month - 1, 1),
      lastDay: new Date(year, month, 0),
    };
  };

  // 月の名前を取得
  const getMonthName = (offset: number) => {
    if (offset === 0) return 'This Month';
    if (offset === -1) return 'Last Month';
    if (offset === 1) return 'Next Month';
    if (offset < 0) return `${Math.abs(offset)} months ago`;
    return `${offset} months later`;
  };

  // 選択された月の集計データを計算
  const monthlySummary = useMemo((): MonthlySummary => {
    const monthInfo = getMonthInfo(selectedMonthOffset);
    
    // 該当月の支出をフィルタリング
    const monthExpenses = state.expenses.filter(expense => 
      expense.date.startsWith(monthInfo.monthStr)
    );

    // カテゴリー別集計
    const categoryBreakdown = new Map<string, { amount: number; count: number; categoryName: string; color: string }>();
    
    monthExpenses.forEach(expense => {
      const categoryId = expense.category || 'uncategorized';
      const category = expense.category ? state.categories.find(c => c.id === expense.category) : null;
      const categoryName = category?.name || 'Uncategorized';
      const color = category?.color || '#CCCCCC';
      
      if (categoryBreakdown.has(categoryId)) {
        const current = categoryBreakdown.get(categoryId)!;
        categoryBreakdown.set(categoryId, {
          amount: current.amount + expense.amount,
          count: current.count + 1,
          categoryName: current.categoryName,
          color: current.color,
        });
      } else {
        categoryBreakdown.set(categoryId, {
          amount: expense.amount,
          count: 1,
          categoryName,
          color,
        });
      }
    });

    const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      month: monthInfo.monthStr,
      totalAmount,
      categoryBreakdown: Array.from(categoryBreakdown.entries())
        .map(([_, data]) => ({
          category: data.categoryName,
          amount: data.amount,
          count: data.count,
          color: data.color,
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [state.expenses, state.categories, selectedMonthOffset]);

  // 日別支出の推移データ
  const dailyExpenses = useMemo(() => {
    const monthInfo = getMonthInfo(selectedMonthOffset);
    const daysInMonth = monthInfo.lastDay.getDate();
    const dailyData: { day: number; amount: number }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthInfo.monthStr}-${day.toString().padStart(2, '0')}`;
      const dayExpenses = state.expenses.filter(expense => expense.date === dateStr);
      const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      dailyData.push({ day, amount: dayTotal });
    }

    return dailyData;
  }, [state.expenses, selectedMonthOffset]);

  // 平均日次支出を計算
  const averageDailyExpense = monthlySummary.totalAmount / dailyExpenses.length;
  const maxDailyExpense = Math.max(...dailyExpenses.map(d => d.amount));

  // 前月比較
  const previousMonthSummary = useMemo(() => {
    const prevMonthInfo = getMonthInfo(selectedMonthOffset - 1);
    const prevMonthExpenses = state.expenses.filter(expense => 
      expense.date.startsWith(prevMonthInfo.monthStr)
    );
    return prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [state.expenses, selectedMonthOffset]);

  const monthInfo = getMonthInfo(selectedMonthOffset);
  const changeFromPrevious = monthlySummary.totalAmount - previousMonthSummary;
  const changePercentage = previousMonthSummary > 0 ? (changeFromPrevious / previousMonthSummary) * 100 : 0;

  return (
    <div className="monthly-summary">
      <div className="monthly-summary-container">
        <header className="monthly-summary-header">
          <h1>Monthly Summary</h1>
          <p>Monthly expense analysis and report</p>
        </header>

        {/* 月選択 */}
        <div className="month-selector">
          <button
            onClick={() => setSelectedMonthOffset(selectedMonthOffset - 1)}
            className="month-nav-button prev"
          >
            ← Last Month
          </button>
          <div className="month-info">
            <h2>{monthInfo.displayName}</h2>
            <p>{monthInfo.year} / {monthInfo.month}</p>
          </div>
          <button
            onClick={() => setSelectedMonthOffset(selectedMonthOffset + 1)}
            className="month-nav-button next"
          >
            Next Month →
          </button>
        </div>

        {/* 月次サマリー */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">◈</div>
            <div className="summary-content">
              <h3>Total Expense</h3>
              <p className="summary-amount">¥{monthlySummary.totalAmount.toLocaleString('en-US')}</p>
              <div className={`summary-change ${changeFromPrevious >= 0 ? 'increase' : 'decrease'}`}>
                {changeFromPrevious >= 0 ? '▲' : '▼'} 
                ¥{Math.abs(changeFromPrevious).toLocaleString()}
                ({changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="summary-card average">
            <div className="summary-icon">●</div>
            <div className="summary-content">
              <h3>Avg. per day</h3>
              <p className="summary-amount">¥{averageDailyExpense.toLocaleString('en-US')}</p>
              <p className="summary-detail">Days with expenses: {dailyExpenses.filter(d => d.amount > 0).length}</p>
            </div>
          </div>

          <div className="summary-card categories">
            <div className="summary-icon">◆</div>
            <div className="summary-content">
              <h3>Categories</h3>
              <p className="summary-amount">{monthlySummary.categoryBreakdown.length}</p>
              <p className="summary-detail">Max per day: ¥{maxDailyExpense.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>

        {/* カテゴリー別詳細 */}
        {monthlySummary.categoryBreakdown.length > 0 && (
          <div className="category-breakdown">
            <h3>Category Breakdown</h3>
            <div className="breakdown-list">
              {monthlySummary.categoryBreakdown.map((item, index) => (
                <div key={index} className="breakdown-item">
                  <div className="breakdown-header">
                    <div className="breakdown-title">
                      <div
                        className="category-color"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="category-name">{item.category}</span>
                    </div>
                    <div className="breakdown-amount">
                      ¥{item.amount.toLocaleString('en-US')}
                    </div>
                  </div>
                  <div className="breakdown-details">
                    <div className="breakdown-bar">
                      <div
                        className="breakdown-fill"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                    <div className="breakdown-stats">
                      <span>{item.percentage.toFixed(1)}%</span>
                      <span>{item.count} items</span>
                      <span>Avg. ¥{Math.round(item.amount / item.count).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 日別支出グラフ */}
        <div className="daily-chart">
          <h3>Daily Expense Trend</h3>
          <div className="chart-container">
            <div className="chart-grid">
              {dailyExpenses.map((data, index) => (
                <div key={index} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{
                      height: maxDailyExpense > 0 ? `${(data.amount / maxDailyExpense) * 100}%` : '0%',
                    }}
                    title={`${data.day}: ¥${data.amount.toLocaleString('en-US')}`}
                  ></div>
                  <div className="bar-label">{data.day}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span>Max: ¥{maxDailyExpense.toLocaleString('en-US')}</span>
              </div>
              <div className="legend-item">
                <span>Avg.: ¥{averageDailyExpense.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* アドバイス */}
        {monthlySummary.totalAmount > 0 && (
          <div className="advice-section">
            <h3>💡 This Month's Analysis</h3>
            <div className="advice-grid">
              <div className="advice-card">
                <h4>Expense Pattern</h4>
                <p>
                  {monthlySummary.categoryBreakdown.length > 0 && 
                    `The largest expense is "${monthlySummary.categoryBreakdown[0].category}", accounting for ${monthlySummary.categoryBreakdown[0].percentage.toFixed(1)}% of the total.`
                  }
                </p>
              </div>
              <div className="advice-card">
                <h4>Comparison with Last Month</h4>
                <p>
                  {changeFromPrevious > 0 
                    ? `¥${changeFromPrevious.toLocaleString('en-US')} more spent than last month.`
                    : changeFromPrevious < 0
                    ? `¥${Math.abs(changeFromPrevious).toLocaleString('en-US')} saved compared to last month.`
                    : 'Same amount spent as last month.'
                  }
                </p>
              </div>
              <div className="advice-card">
                <h4>Expense Frequency</h4>
                <p>
                  {dailyExpenses.filter(d => d.amount > 0).length} days with expenses, averaging ¥{averageDailyExpense.toLocaleString('en-US')} per day.
                </p>
              </div>
            </div>
          </div>
        )}

        {monthlySummary.totalAmount === 0 && (
          <div className="empty-state">
            <h3>◆ No Expense Data</h3>
            <p>No expense data for this month.</p>
            <p>Try recording expenses from the daily input screen.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySummaryPage; 