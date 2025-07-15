import React, { useState, useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import type { Category } from '../types';
import './WeeklyList.css';

const WeeklyList: React.FC = () => {
  const { state, updateExpense, deleteExpense, addCategory } = useExpense();
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = 今週, -1 = 先週, 1 = 来週
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#c9a96e');

  // 選択された週の開始日と終了日を計算
  const getWeekRange = (offset: number) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (offset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  // 選択された週の支出をフィルタリング
  const weekExpenses = useMemo(() => {
    const { startOfWeek, endOfWeek } = getWeekRange(selectedWeekOffset);
    
    return state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startOfWeek && expenseDate <= endOfWeek;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.expenses, selectedWeekOffset]);

  // 週の名前を取得
  const getWeekName = (offset: number) => {
    if (offset === 0) return '今週';
    if (offset === -1) return '先週';
    if (offset === 1) return '来週';
    if (offset < 0) return `${Math.abs(offset)}週間前`;
    return `${offset}週間後`;
  };

  // カテゴリーを更新
  const handleCategoryChange = async (expenseId: string, categoryId: string) => {
    const expense = state.expenses.find(e => e.id === expenseId);
    if (expense) {
      try {
        await updateExpense({ ...expense, category: categoryId || undefined });
      } catch (error) {
        alert('カテゴリー更新に失敗しました');
      }
    }
  };

  // 支出を削除
  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('この支出を削除しますか？')) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        alert('削除に失敗しました');
      }
    }
  };

  // 新しいカテゴリーを追加
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      try {
        await addCategory({
          name: newCategoryName.trim(),
          color: newCategoryColor,
        });
            setNewCategoryName('');
    setNewCategoryColor('#c9a96e');
        setShowCategoryModal(false);
      } catch (error) {
        alert('カテゴリー追加に失敗しました');
      }
    }
  };

  // カテゴリー別の集計を計算
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { amount: number; count: number; category: Category | null }>();
    
    weekExpenses.forEach(expense => {
      const categoryId = expense.category || 'uncategorized';
      const category = expense.category ? state.categories.find(c => c.id === expense.category) || null : null;
      
      if (stats.has(categoryId)) {
        const current = stats.get(categoryId)!;
        stats.set(categoryId, {
          amount: current.amount + expense.amount,
          count: current.count + 1,
          category: current.category,
        });
      } else {
        stats.set(categoryId, {
          amount: expense.amount,
          count: 1,
          category,
        });
      }
    });
    
    return Array.from(stats.entries()).map(([categoryId, data]) => ({
      categoryId,
      name: data.category?.name || '未分類',
      color: data.category?.color || '#CCCCCC',
      amount: data.amount,
      count: data.count,
    }));
  }, [weekExpenses, state.categories]);

  const { startOfWeek, endOfWeek } = getWeekRange(selectedWeekOffset);
  const totalAmount = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const colorOptions = [
    '#c9a96e', '#4ECDC4', '#45B7D1', '#96CEB4', '#FCEA2B',
    '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  return (
    <div className="weekly-list">
      <div className="weekly-list-container">
        <header className="weekly-list-header">
          <h1>支出リスト</h1>
          <p>週ごとの支出を確認し、カテゴリーを設定しましょう</p>
        </header>

        {/* 週選択 */}
        <div className="week-selector">
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
            className="week-nav-button prev"
          >
            ← 前週
          </button>
          <div className="week-info">
            <h2>{getWeekName(selectedWeekOffset)}</h2>
            <p>
              {startOfWeek.toLocaleDateString('ja-JP')} 〜 {endOfWeek.toLocaleDateString('ja-JP')}
            </p>
          </div>
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
            className="week-nav-button next"
          >
            来週 →
          </button>
        </div>

        {/* 週間サマリー */}
        <div className="week-summary">
          <div className="summary-item">
            <span className="summary-label">総支出</span>
            <span className="summary-value">¥{totalAmount.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">支出件数</span>
            <span className="summary-value">{weekExpenses.length}件</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">カテゴリー数</span>
            <span className="summary-value">{categoryStats.length}分類</span>
          </div>
        </div>

        {/* カテゴリー別集計 */}
        {categoryStats.length > 0 && (
          <div className="category-stats">
            <h3>カテゴリー別集計</h3>
            <div className="stats-grid">
              {categoryStats.map((stat) => (
                <div key={stat.categoryId} className="stat-card">
                  <div
                    className="stat-color"
                    style={{ backgroundColor: stat.color }}
                  ></div>
                  <div className="stat-content">
                    <div className="stat-name">{stat.name}</div>
                    <div className="stat-amount">¥{stat.amount.toLocaleString()}</div>
                    <div className="stat-count">{stat.count}件</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 支出リスト */}
        <div className="expenses-section">
          <div className="section-header">
            <h3>支出一覧</h3>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="add-category-button"
            >
              + カテゴリー追加
            </button>
          </div>

          {weekExpenses.length === 0 ? (
            <div className="empty-state">
              <p>この週に支出はありません</p>
            </div>
          ) : (
            <div className="expenses-list">
              {weekExpenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-date">
                    {new Date(expense.date).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                  <div className="expense-content">
                    <div className="expense-description">{expense.description}</div>
                    <div className="expense-amount">¥{expense.amount.toLocaleString()}</div>
                  </div>
                  <div className="expense-category">
                    <select
                      value={expense.category || ''}
                      onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                      className="category-select"
                    >
                      <option value="">未分類</option>
                      {state.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="expense-actions">
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="delete-button"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* カテゴリー追加モーダル */}
        {showCategoryModal && (
          <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>新しいカテゴリーを追加</h3>
              <form onSubmit={handleAddCategory}>
                <div className="form-group">
                  <label htmlFor="categoryName">カテゴリー名</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="例: 医療費"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="categoryColor">色</label>
                  <div className="color-picker">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${newCategoryColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategoryColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="cancel-button"
                  >
                    キャンセル
                  </button>
                  <button type="submit" className="submit-button">
                    追加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyList; 