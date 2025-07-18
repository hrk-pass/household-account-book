import React, { useState, useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import type { KitchenSubCategory, FoodItem, Expense } from '../types';
import './MealLog.css';

const MealLog: React.FC = () => {
  const { state, updateExpense } = useExpense();
  const [selectedSubCategory, setSelectedSubCategory] = useState<KitchenSubCategory | 'all'>('all');
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    subCategory: KitchenSubCategory | '';
  }>({
    subCategory: '',
  });

  // kitchenカテゴリーの明細のみを取得
  const kitchenExpenses = useMemo(() => {
    return state.expenses.filter(expense => 
      expense.category === 'kitchen'
    );
  }, [state.expenses]);

  // サブカテゴリーでフィルタリング
  const filteredExpenses = useMemo(() => {
    if (selectedSubCategory === 'all') {
      return kitchenExpenses;
    }
    return kitchenExpenses.filter(expense => 
      expense.subCategory === selectedSubCategory
    );
  }, [kitchenExpenses, selectedSubCategory]);

  // 食材の消費率を計算（消費率が100%の食材は表示対象から除外）
  const availableFoodItems = useMemo(() => {
    return filteredExpenses
      .filter(expense => 
        expense.subCategory === '食材' && 
        (expense.consumptionRate ?? 0) < 100
      )
      .map(expense => ({
        ...expense,
        consumptionRate: expense.consumptionRate ?? 0,
        isConsumed: (expense.consumptionRate ?? 0) >= 100
      } as FoodItem));
  }, [filteredExpenses]);

  const subCategories: (KitchenSubCategory | 'all')[] = ['all', '食材', '調味料', '消耗品', 'その他'];
  const kitchenSubCategories: KitchenSubCategory[] = ['食材', '調味料', '消耗品', 'その他'];

  // 編集開始
  const startEdit = (expense: Expense) => {
    setEditingExpense(expense.id);
    setEditForm({
      subCategory: (expense.subCategory as KitchenSubCategory) || '',
    });
  };

  // 編集保存
  const saveEdit = async (expense: Expense) => {
    try {
      await updateExpense({
        ...expense,
        subCategory: editForm.subCategory,
      });
      setEditingExpense(null);
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingExpense(null);
    setEditForm({
      subCategory: '',
    });
  };

  return (
    <div className="meal-log">
      <div className="meal-log-container">
        <header className="meal-log-header">
          <h1>食事Log</h1>
          <p>キッチン用品と食材の管理</p>
        </header>

        {/* サブカテゴリーフィルター */}
        <div className="sub-category-filter">
          <h3>カテゴリー選択</h3>
          <div className="filter-buttons">
            {subCategories.map((subCat) => (
              <button
                key={subCat}
                className={`filter-button ${selectedSubCategory === subCat ? 'active' : ''}`}
                onClick={() => setSelectedSubCategory(subCat)}
              >
                {subCat === 'all' ? '全て' : subCat}
              </button>
            ))}
          </div>
        </div>

        {/* 明細表示 */}
        <div className="expense-list">
          <h3>
            {selectedSubCategory === 'all' ? 'キッチン関連' : selectedSubCategory}明細 
            ({filteredExpenses.length}件)
          </h3>
          
          {filteredExpenses.length === 0 ? (
            <div className="no-data">
              <p>該当する明細がありません</p>
            </div>
          ) : (
            <div className="expense-items">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                  {editingExpense === expense.id ? (
                    // 編集モード
                    <div className="expense-edit-form">
                      <div className="edit-header">
                        <h4>{expense.description}</h4>
                        <p>¥{expense.amount.toLocaleString()} | {expense.date}</p>
                      </div>
                      
                      <div className="edit-fields">
                        <div className="edit-field">
                          <label>サブカテゴリー</label>
                          <select
                            value={editForm.subCategory}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              subCategory: e.target.value as KitchenSubCategory 
                            }))}
                            className="edit-select"
                          >
                            <option value="">選択してください</option>
                            {kitchenSubCategories.map((subCat) => (
                              <option key={subCat} value={subCat}>
                                {subCat}
                              </option>
                            ))}
                          </select>
                        </div>


                      </div>

                      <div className="edit-actions">
                        <button
                          onClick={() => saveEdit(expense)}
                          className="save-button"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="cancel-edit-button"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 表示モード
                    <div className="expense-info">
                      <div className="expense-details">
                        <h4>{expense.description}</h4>
                        <p className="expense-meta">
                          {expense.date} | ¥{expense.amount.toLocaleString()}
                          {expense.subCategory ? (
                            <span className="sub-category-tag">
                              {expense.subCategory}
                            </span>
                          ) : (
                            <span className="no-subcategory-tag">
                              未設定
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="expense-actions">
                        {expense.subCategory === '食材' && (
                          <div className="consumption-info">
                            <div className="consumption-rate">
                              <span>消費率: {expense.consumptionRate ?? 0}%</span>
                              <div className="consumption-bar">
                                <div 
                                  className="consumption-fill"
                                  style={{ width: `${expense.consumptionRate ?? 0}%` }}
                                />
                              </div>
                            </div>
                            {(expense.consumptionRate ?? 0) >= 100 && (
                              <span className="consumed-badge">消費済み</span>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => startEdit(expense)}
                          className="edit-button"
                        >
                          設定
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 食材使用可能リスト */}
        {selectedSubCategory === '食材' || selectedSubCategory === 'all' ? (
          <div className="available-ingredients">
            <h3>使用可能な食材 ({availableFoodItems.length}件)</h3>
            {availableFoodItems.length === 0 ? (
              <div className="no-data">
                <p>使用可能な食材がありません</p>
              </div>
            ) : (
              <div className="ingredient-grid">
                {availableFoodItems.map((item) => (
                  <div key={item.id} className="ingredient-card">
                    <h4>{item.description}</h4>
                    <p>残り: {100 - item.consumptionRate}%</p>
                    <div className="consumption-bar small">
                      <div 
                        className="consumption-fill"
                        style={{ width: `${item.consumptionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MealLog; 