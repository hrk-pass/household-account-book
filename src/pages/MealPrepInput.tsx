import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import type { FoodItem } from '../types';
import './MealPrepInput.css';

const MealPrepInput: React.FC = () => {
  const navigate = useNavigate();
  const { state, addMealPrepItem, updateExpense } = useExpense();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealPrepName, setMealPrepName] = useState('');
  const [notes, setNotes] = useState('');
  const [consumptionUpdates, setConsumptionUpdates] = useState<{ [expenseId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 使用可能な食材を取得（消費率が100%未満の食材）
  const availableFoodItems = useMemo(() => {
    return state.expenses
      .filter(expense => 
        expense.category === 'kitchen' && 
        expense.subCategory === '食材' &&
        (expense.consumptionRate ?? 0) < 100
      )
      .map(expense => ({
        ...expense,
        consumptionRate: expense.consumptionRate ?? 0,
        isConsumed: (expense.consumptionRate ?? 0) >= 100
      } as FoodItem))
      .sort((a, b) => a.description.localeCompare(b.description));
  }, [state.expenses]);

  // 消費率を更新
  const handleConsumptionChange = (expenseId: string, newRate: number) => {
    setConsumptionUpdates(prev => ({
      ...prev,
      [expenseId]: newRate
    }));
  };

  // 作り置きを保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mealPrepName.trim()) {
      alert('作り置きの名前を入力してください');
      return;
    }

    if (Object.keys(consumptionUpdates).length === 0) {
      alert('少なくとも1つの食材の消費率を更新してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // 食材の消費率を更新
      await Promise.all(
        Object.entries(consumptionUpdates).map(async ([expenseId, newRate]) => {
          const expense = state.expenses.find(e => e.id === expenseId);
          if (expense) {
            await updateExpense({
              ...expense,
              consumptionRate: Math.min(100, (expense.consumptionRate ?? 0) + newRate)
            });
          }
        })
      );

      // 作り置きアイテムを保存
      await addMealPrepItem({
        name: mealPrepName.trim(),
        date: selectedDate,
        ingredients: Object.keys(consumptionUpdates),
        ingredientConsumption: consumptionUpdates, // 各食材の消費率情報を保存
        consumptionRate: 0,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        createdAt: new Date().toISOString(),
      });

      // 成功メッセージを表示してリセット
      alert(`${mealPrepName}の作り置き記録が完了しました`);
      setMealPrepName('');
      setNotes('');
      setConsumptionUpdates({});

    } catch (error) {
      console.error('作り置き保存エラー:', error);
      alert('作り置きの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="meal-prep-input">
      <div className="meal-prep-input-container">
        <header className="meal-prep-input-header">
          <h1>作り置き入力</h1>
          <p>作り置きした料理の記録</p>
        </header>

        <form onSubmit={handleSubmit} className="meal-prep-form">
          {/* 基本情報 */}
          <div className="meal-prep-basic-info">
            <div className="form-group">
              <label htmlFor="name">作り置き名 *</label>
              <input
                type="text"
                id="name"
                value={mealPrepName}
                onChange={(e) => setMealPrepName(e.target.value)}
                placeholder="例：カレー、味噌汁、おにぎり"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">作り置き日</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
              />
            </div>


          </div>

          {/* 食材消費率入力 */}
          <div className="ingredients-section">
            <h3>食材の消費率を入力 ({availableFoodItems.length}件)</h3>
            
            {availableFoodItems.length === 0 ? (
              <div className="no-ingredients">
                <p>使用可能な食材がありません</p>
                <p>まず食材をkitchenカテゴリーで購入記録してください</p>
              </div>
            ) : (
              <div className="ingredients-grid">
                {availableFoodItems.map((item) => {
                  const currentConsumption = item.consumptionRate;
                  const additionalConsumption = consumptionUpdates[item.id] || 0;
                  const totalConsumption = Math.min(100, currentConsumption + additionalConsumption);
                  
                  return (
                    <div key={item.id} className="ingredient-item">
                      <div className="ingredient-info">
                        <h4>{item.description}</h4>
                        <p className="ingredient-meta">
                          ¥{item.amount.toLocaleString()} | {item.date}
                        </p>
                        
                        <div className="consumption-display">
                          <span>現在の消費率: {currentConsumption}%</span>
                          <div className="consumption-bar">
                            <div 
                              className="consumption-fill current"
                              style={{ width: `${currentConsumption}%` }}
                            />
                            {additionalConsumption > 0 && (
                              <div 
                                className="consumption-fill additional"
                                style={{ 
                                  width: `${additionalConsumption}%`,
                                  left: `${currentConsumption}%`
                                }}
                              />
                            )}
                          </div>
                          <span className="total-consumption">
                            合計: {totalConsumption}%
                          </span>
                        </div>
                      </div>

                      <div className="consumption-input">
                        <label>今回の使用量</label>
                        <div className="consumption-buttons">
                          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
                            .filter(option => option <= 100 - currentConsumption)
                            .map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`consumption-button ${additionalConsumption === option ? 'active' : ''}`}
                              onClick={() => handleConsumptionChange(item.id, option)}
                            >
                              +{option}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* メモ入力 */}
          <div className="form-group">
            <label htmlFor="notes">メモ（任意）</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="レシピや保存方法、注意点などを記録..."
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* アクションボタン */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/meal-log')}
              className="cancel-button"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !mealPrepName.trim() || Object.keys(consumptionUpdates).length === 0}
            >
              {isSubmitting ? '記録中...' : '作り置きを記録'}
            </button>
          </div>
        </form>

        {/* 使用ガイド */}
        <div className="usage-guide">
          <h3>◆ 使用方法</h3>
          <ul>
            <li><strong>作り置き名</strong>：料理の名前を入力（例：カレー、味噌汁）</li>
            <li><strong>食材の消費率</strong>：使用した食材の消費率を10%単位で記録</li>
            <li>作り置きした料理は食事入力時に選択できます</li>
            <li>食材の消費率は作り置き作成時に更新されます</li>
            <li>作り置きの消費率は食事入力時に記録できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MealPrepInput; 