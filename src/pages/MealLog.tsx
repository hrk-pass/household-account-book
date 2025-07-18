import React, { useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import './MealLog.css';

const MealLog: React.FC = () => {
  const { state, updateExpense } = useExpense();

  // カテゴリー「kitchen」の明細をフィルタリング（日付順）
  const kitchenExpenses = useMemo(() => {
    return state.expenses
      .filter(expense => expense.category === 'kitchen')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.expenses]);

  // サブカテゴリーの選択肢
  const subCategoryOptions = ['食材', '調味料', '消耗品', 'その他'];

  // サブカテゴリーを更新
  const handleSubCategoryChange = async (expenseId: string, subCategory: string) => {
    const expense = state.expenses.find(e => e.id === expenseId);
    if (expense) {
      try {
        await updateExpense({ ...expense, subCategory: subCategory || undefined });
      } catch (error) {
        alert('サブカテゴリー更新に失敗しました');
      }
    }
  };

  // 総額を計算
  const totalAmount = kitchenExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="meal-log">
      <div className="meal-log-container">
        <header className="meal-log-header">
          <h1>食事Log</h1>
          <p>キッチン用品と食材の管理</p>
        </header>

        <div className="content">
          {/* サマリー情報 */}
          <div className="kitchen-summary">
            <div className="summary-item">
              <span className="summary-label">総支出</span>
              <span className="summary-value">¥{totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">明細件数</span>
              <span className="summary-value">{kitchenExpenses.length}件</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">サブカテゴリー数</span>
              <span className="summary-value">
                {new Set(kitchenExpenses.map(e => e.subCategory).filter(Boolean)).size}分類
              </span>
            </div>
          </div>

          {/* 明細リスト */}
          {kitchenExpenses.length > 0 ? (
            <div className="kitchen-expenses">
              <div className="expenses-section">
                <h3>キッチン明細一覧（日付順）</h3>
                
                <div className="expenses-list">
                  {kitchenExpenses.map((expense) => (
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
                      
                      {/* サブカテゴリー設定 */}
                      <div className="expense-subcategory">
                        <select
                          value={expense.subCategory || ''}
                          onChange={(e) => handleSubCategoryChange(expense.id, e.target.value)}
                          className="subcategory-select"
                        >
                          <option value="">未設定</option>
                          {subCategoryOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      {/* 消費率表示 */}
                      {expense.consumptionRate !== undefined && (
                        <div className="consumption-rate">
                          <span className="rate-label">消費率</span>
                          <span className="rate-value">{expense.consumptionRate}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>カテゴリー「kitchen」の明細がありません</p>
              <p>支出入力でカテゴリーを「kitchen」に設定してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealLog; 