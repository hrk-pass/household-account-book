import React, { useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import './MealLog.css';

const MealLog: React.FC = () => {
  const { state, updateExpense } = useExpense();

  // カテゴリー「kitchen」の明細をフィルタリング（日付順）
  const kitchenExpenses = useMemo(() => {
    const filtered = state.expenses
      .filter(expense => {
        if (!expense.category) return false;
        const category = state.categories.find(c => c.id === expense.category);
        return category?.name === 'kitchen';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // デバッグ情報
    console.log('MealLog - 全明細:', state.expenses.length);
    console.log('MealLog - kitchen明細:', filtered.length);
    console.log('MealLog - kitchen明細詳細:', filtered.map(expense => ({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      categoryName: state.categories.find(c => c.id === expense.category)?.name,
      subCategory: expense.subCategory,
      consumptionRate: expense.consumptionRate
    })));
    
    // カテゴリーIDでのフィルタリング結果も確認
    const categoryIdFiltered = state.expenses.filter(expense => 
      expense.category === 'kitchen'
    );
    console.log('MealLog - カテゴリーIDでフィルタリング:', categoryIdFiltered.length);
    console.log('MealLog - カテゴリーIDでフィルタリング詳細:', categoryIdFiltered.map(expense => ({
      id: expense.id,
      description: expense.description,
      category: expense.category,
      categoryName: state.categories.find(c => c.id === expense.category)?.name,
      subCategory: expense.subCategory,
      consumptionRate: expense.consumptionRate
    })));
    
    return filtered;
  }, [state.expenses, state.categories]);

  // サブカテゴリーの選択肢
  const subCategoryOptions = ['Ingredient', 'Seasoning', 'Consumable', 'Other'];

  // サブカテゴリーを更新
  const handleSubCategoryChange = async (expenseId: string, subCategory: string) => {
    const expense = state.expenses.find(e => e.id === expenseId);
    if (expense) {
      try {
        // 空文字列の場合はundefinedを設定
        const updatedSubCategory = subCategory === '' ? undefined : subCategory;
        await updateExpense({ ...expense, subCategory: updatedSubCategory });
        console.log(`サブカテゴリー更新: ${expense.description} → ${updatedSubCategory}`);
        
        // 強制的にstateを更新（リアルタイム更新の遅延対策）
        setTimeout(() => {
          console.log('強制更新後のstate確認');
          console.log('MealLog - 現在のkitchen明細:', kitchenExpenses.length, '件');
          console.log('MealLog - 現在のkitchen明細詳細:', kitchenExpenses.map(expense => ({
            id: expense.id,
            description: expense.description,
            subCategory: expense.subCategory,
            consumptionRate: expense.consumptionRate
          })));
        }, 2000);
      } catch (error) {
        console.error('サブカテゴリー更新エラー:', error);
        alert('Failed to update subcategory');
      }
    }
  };

  // 総額を計算
  const totalAmount = kitchenExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="meal-log">
      <div className="meal-log-container">
        <header className="meal-log-header">
          <h1>Meal Log</h1>
          <p>Manage kitchen items and ingredients</p>
        </header>

        <div className="content">
          {/* サマリー情報 */}
          <div className="kitchen-summary">
            <div className="summary-item">
              <span className="summary-label">Total</span>
              <span className="summary-value">¥{totalAmount.toLocaleString('en-US')}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Count</span>
              <span className="summary-value">{kitchenExpenses.length} items</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Subcategories</span>
              <span className="summary-value">
                {new Set(kitchenExpenses.map(e => e.subCategory).filter(Boolean)).size}
              </span>
            </div>
          </div>

          {/* 明細リスト */}
          {kitchenExpenses.length > 0 ? (
            <div className="kitchen-expenses">
              <div className="expenses-section">
                <h3>Kitchen Items (by date)</h3>
                
                <div className="expenses-list">
                  {kitchenExpenses.map((expense) => (
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
                        <div className="expense-amount">¥{expense.amount.toLocaleString()}</div>
                      </div>
                      
                      {/* サブカテゴリー設定 */}
                      <div className="expense-subcategory">
                        <select
                          value={expense.subCategory || ''}
                          onChange={(e) => handleSubCategoryChange(expense.id, e.target.value)}
                          className="subcategory-select"
                        >
                          <option value="">Unset</option>
                          {subCategoryOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      {/* 消費率表示 */}
                      {expense.consumptionRate !== undefined && (
                        <div className="consumption-rate">
                          <span className="rate-label">Consumption Rate</span>
                          <span className="rate-value">{expense.consumptionRate}%</span>
                          <div className="consumption-bar">
                            <div 
                              className="consumption-fill"
                              style={{ width: `${expense.consumptionRate}%` }}
                            />
                          </div>
                          {expense.consumptionRate >= 100 && (
                            <span className="consumed-label">Consumed</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No kitchen items found in category "kitchen"</p>
              <p>Set the category to "kitchen" in Expense Input</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealLog; 