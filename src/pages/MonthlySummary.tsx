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
    if (offset === 0) return '今月';
    if (offset === -1) return '先月';
    if (offset === 1) return '来月';
    if (offset < 0) return `${Math.abs(offset)}ヶ月前`;
    return `${offset}ヶ月後`;
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
      const categoryName = category?.name || '未分類';
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
          <h1>月次集計</h1>
          <p>月ごとの支出分析とレポート</p>
        </header>

        {/* 月選択 */}
        <div className="month-selector">
          <button
            onClick={() => setSelectedMonthOffset(selectedMonthOffset - 1)}
            className="month-nav-button prev"
          >
            ← 前月
          </button>
          <div className="month-info">
            <h2>{monthInfo.displayName}</h2>
            <p>{monthInfo.year}年{monthInfo.month}月</p>
          </div>
          <button
            onClick={() => setSelectedMonthOffset(selectedMonthOffset + 1)}
            className="month-nav-button next"
          >
            翌月 →
          </button>
        </div>

        {/* 月次サマリー */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h3>総支出</h3>
              <p className="summary-amount">¥{monthlySummary.totalAmount.toLocaleString()}</p>
              <div className={`summary-change ${changeFromPrevious >= 0 ? 'increase' : 'decrease'}`}>
                {changeFromPrevious >= 0 ? '↗' : '↘'} 
                ¥{Math.abs(changeFromPrevious).toLocaleString()}
                ({changePercentage > 0 ? '+' : ''}{changePercentage.toFixed(1)}%)
              </div>
            </div>
          </div>

          <div className="summary-card average">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <h3>1日平均</h3>
              <p className="summary-amount">¥{averageDailyExpense.toLocaleString()}</p>
              <p className="summary-detail">支出日数: {dailyExpenses.filter(d => d.amount > 0).length}日</p>
            </div>
          </div>

          <div className="summary-card categories">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h3>カテゴリー数</h3>
              <p className="summary-amount">{monthlySummary.categoryBreakdown.length}</p>
              <p className="summary-detail">最大日次: ¥{maxDailyExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* カテゴリー別詳細 */}
        {monthlySummary.categoryBreakdown.length > 0 && (
          <div className="category-breakdown">
            <h3>カテゴリー別内訳</h3>
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
                      ¥{item.amount.toLocaleString()}
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
                      <span>{item.count}件</span>
                      <span>平均 ¥{Math.round(item.amount / item.count).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 日別支出グラフ */}
        <div className="daily-chart">
          <h3>日別支出推移</h3>
          <div className="chart-container">
            <div className="chart-grid">
              {dailyExpenses.map((data, index) => (
                <div key={index} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{
                      height: maxDailyExpense > 0 ? `${(data.amount / maxDailyExpense) * 100}%` : '0%',
                    }}
                    title={`${data.day}日: ¥${data.amount.toLocaleString()}`}
                  ></div>
                  <div className="bar-label">{data.day}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span>最大: ¥{maxDailyExpense.toLocaleString()}</span>
              </div>
              <div className="legend-item">
                <span>平均: ¥{averageDailyExpense.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* アドバイス */}
        {monthlySummary.totalAmount > 0 && (
          <div className="advice-section">
            <h3>💡 今月の分析</h3>
            <div className="advice-grid">
              <div className="advice-card">
                <h4>支出パターン</h4>
                <p>
                  {monthlySummary.categoryBreakdown.length > 0 && 
                    `最も多い支出は「${monthlySummary.categoryBreakdown[0].category}」で、
                    全体の${monthlySummary.categoryBreakdown[0].percentage.toFixed(1)}%を占めています。`
                  }
                </p>
              </div>
              <div className="advice-card">
                <h4>前月比較</h4>
                <p>
                  {changeFromPrevious > 0 
                    ? `前月より¥${changeFromPrevious.toLocaleString()}多く支出しています。`
                    : changeFromPrevious < 0
                    ? `前月より¥${Math.abs(changeFromPrevious).toLocaleString()}節約できています。`
                    : '前月と同額の支出です。'
                  }
                </p>
              </div>
              <div className="advice-card">
                <h4>支出頻度</h4>
                <p>
                  {dailyExpenses.filter(d => d.amount > 0).length}日間で支出があり、
                  1日平均¥{averageDailyExpense.toLocaleString()}使っています。
                </p>
              </div>
            </div>
          </div>
        )}

        {monthlySummary.totalAmount === 0 && (
          <div className="empty-state">
            <h3>📈 支出データなし</h3>
            <p>この月の支出データがありません。</p>
            <p>日次入力画面から支出を記録してみましょう。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySummaryPage; 