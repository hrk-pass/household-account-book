import React, { useState, useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import type { Category } from '../types';
import './WeeklyList.css';

const WeeklyList: React.FC = () => {
  const { state, updateExpense, deleteExpense, addCategory, updateCategory, deleteCategory } = useExpense();
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0); // 0 = This Week, -1 = Last Week, 1 = Next Week
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#c9a96e');
  // 編集用
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('#c9a96e');
  const [showEditModal, setShowEditModal] = useState(false);

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
    if (offset === 0) return 'This Week';
    if (offset === -1) return 'Last Week';
    if (offset === 1) return 'Next Week';
    if (offset < 0) return `${Math.abs(offset)} weeks ago`;
    return `${offset} weeks later`;
  };

  // カテゴリーを更新
  const handleCategoryChange = async (expenseId: string, categoryId: string) => {
    const expense = state.expenses.find(e => e.id === expenseId);
    if (expense) {
      try {
        await updateExpense({ ...expense, category: categoryId || undefined });
      } catch (error) {
        alert('Failed to update category');
      }
    }
  };

  // 支出を削除
  const handleDeleteExpense = async (expenseId: string) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        alert('Failed to delete');
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
        alert('Failed to add category');
      }
    }
  };

  // カテゴリー編集モーダルを開く
  const handleEditCategoryOpen = (category: Category) => {
    setEditCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
    setShowEditModal(true);
  };

  // カテゴリー編集を保存
  const handleEditCategorySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;
    try {
      await updateCategory({
        ...editCategory,
        name: editCategoryName,
        color: editCategoryColor,
      });
      setShowEditModal(false);
      setEditCategory(null);
    } catch (error) {
      alert('カテゴリの更新に失敗しました');
    }
  };

  // カテゴリー削除
  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('本当にこのカテゴリを削除しますか？（このカテゴリに紐づく支出は「未分類」になります）')) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        alert('カテゴリの削除に失敗しました');
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
      name: data.category?.name || 'Uncategorized',
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
          <h1>Expense List</h1>
          <p>Check weekly expenses and set categories</p>
        </header>

        {/* 週選択 */}
        <div className="week-selector">
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
            className="week-nav-button prev"
          >
            ← Previous Week
          </button>
          <div className="week-info">
            <h2>{getWeekName(selectedWeekOffset)}</h2>
            <p>
              {startOfWeek.toLocaleDateString('en-US')} ~ {endOfWeek.toLocaleDateString('en-US')}
            </p>
          </div>
          <button
            onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
            className="week-nav-button next"
          >
            Next Week →
          </button>
        </div>

        {/* 週間サマリー */}
        <div className="week-summary">
          <div className="summary-item">
            <span className="summary-label">Total</span>
            <span className="summary-value">¥{totalAmount.toLocaleString('en-US')}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Count</span>
            <span className="summary-value">{weekExpenses.length} items</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Categories</span>
            <span className="summary-value">{categoryStats.length}</span>
          </div>
        </div>

        {/* カテゴリー別集計 */}
        {categoryStats.length > 0 && (
          <div className="category-stats">
            <h3>Category Breakdown</h3>
            <div className="stats-grid">
              {categoryStats.map((stat) => (
                <div key={stat.categoryId} className="stat-card">
                  <div
                    className="stat-color"
                    style={{ backgroundColor: stat.color }}
                  ></div>
                  <div className="stat-content">
                    <div className="stat-name">{stat.name}</div>
                    <div className="stat-amount">¥{stat.amount.toLocaleString('en-US')}</div>
                    <div className="stat-count">{stat.count} items</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* カテゴリ管理セクション */}
        <div className="category-manage-section">
          <h3>カテゴリ管理</h3>
          <div className="category-list">
            {state.categories.map((category) => (
              <div key={category.id} className="category-item">
                <span className="category-color" style={{ backgroundColor: category.color, display: 'inline-block', width: 16, height: 16, borderRadius: '50%', marginRight: 8 }} />
                <span className="category-name">{category.name}</span>
                <button className="edit-category-btn" onClick={() => handleEditCategoryOpen(category)} style={{ marginLeft: 8 }}>編集</button>
                <button className="delete-category-btn" onClick={() => handleDeleteCategory(category.id)} style={{ marginLeft: 4 }}>削除</button>
              </div>
            ))}
          </div>
        </div>

        {/* 支出リスト */}
        <div className="expenses-section">
          <div className="section-header">
            <h3>Expense List</h3>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="add-category-button"
            >
              + Add Category
            </button>
          </div>

          {weekExpenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses this week</p>
            </div>
          ) : (
            <div className="expenses-list">
              {weekExpenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-date">
                    {new Date(expense.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                  <div className="expense-content">
                    <div className="expense-description">{expense.description}</div>
                    {expense.storeName && (
                      <div className="expense-storeName">{expense.storeName}</div>
                    )}
                    <div className="expense-amount">¥{expense.amount.toLocaleString()}</div>
                  </div>
                  <div className="expense-category">
                    <select
                      value={expense.category || ''}
                      onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                      className="category-select"
                    >
                      <option value="">Uncategorized</option>
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
                      title="Delete"
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
              <h3>Add New Category</h3>
              <form onSubmit={handleAddCategory}>
                <div className="form-group">
                  <label htmlFor="categoryName">Category Name</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Medical"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="categoryColor">Color</label>
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
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* カテゴリー編集モーダル */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>カテゴリ編集</h3>
              <form onSubmit={handleEditCategorySave}>
                <div className="form-group">
                  <label htmlFor="editCategoryName">カテゴリ名</label>
                  <input
                    type="text"
                    id="editCategoryName"
                    value={editCategoryName}
                    onChange={e => setEditCategoryName(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editCategoryColor">色</label>
                  <div className="color-picker">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${editCategoryColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditCategoryColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowEditModal(false)} className="cancel-button">キャンセル</button>
                  <button type="submit" className="submit-button">保存</button>
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