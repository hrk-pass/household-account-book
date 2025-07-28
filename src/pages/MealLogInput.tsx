import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import type { MealType, FoodItem } from '../types';
import './MealLogInput.css';

const MealLogInput: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateExpense, addMealLog, updateMealPrepItem, deleteMealPrepItem } = useExpense();
  
  // コンポーネントマウント時のデバッグ
  React.useEffect(() => {
    console.log('MealLogInput - コンポーネントマウント');
    console.log('MealLogInput - 初期state.expenses:', state.expenses.length, '件');
  }, []);
  
  // state.expensesの変更を監視
  React.useEffect(() => {
    console.log('MealLogInput - state.expenses変更検知:', state.expenses.length, '件');
  }, [state.expenses]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Breakfast');
  const [mealNotes, setMealNotes] = useState('');
  const [consumptionUpdates, setConsumptionUpdates] = useState<{ [expenseId: string]: number }>({});
  const [mealPrepConsumptionUpdates, setMealPrepConsumptionUpdates] = useState<{ [itemId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnused, setIsUnused] = useState(false);

  // 使用可能な食材を取得（消費率が100%未満の食材）
  const availableFoodItems = useMemo(() => {
    console.log('MealLogInput - useMemo実行開始');
    console.log('MealLogInput - state.expenses:', state.expenses.length, '件');
    
    const kitchenExpenses = state.expenses.filter(expense => {
      if (!expense.category) return false;
      const category = state.categories.find(c => c.id === expense.category);
      return category?.name === 'kitchen' && (expense.consumptionRate ?? 0) < 100;
    });
    
    const foodItems = kitchenExpenses
      .filter(expense => expense.subCategory === 'Ingredient')
      .map(expense => ({
        ...expense,
        consumptionRate: expense.consumptionRate ?? 0,
        isConsumed: (expense.consumptionRate ?? 0) >= 100
      } as FoodItem))
      .sort((a, b) => a.description.localeCompare(b.description));
    
    // デバッグ情報
    console.log('MealLogInput - 全kitchen明細:', kitchenExpenses.length);
    console.log('MealLogInput - 全kitchen明細詳細:', kitchenExpenses.map(item => ({
      id: item.id,
      description: item.description,
      category: item.category,
      categoryName: state.categories.find(c => c.id === item.category)?.name,
      subCategory: item.subCategory,
      consumptionRate: item.consumptionRate
    })));
    console.log('MealLogInput - 食材サブカテゴリー明細:', foodItems.length);
    console.log('MealLogInput - 食材明細詳細:', foodItems.map(item => ({
      id: item.id,
      description: item.description,
      subCategory: item.subCategory,
      consumptionRate: item.consumptionRate
    })));
    
    // 全明細の詳細も確認
    console.log('MealLogInput - 全明細詳細:', state.expenses.map(item => ({
      id: item.id,
      description: item.description,
      category: item.category,
      categoryName: state.categories.find(c => c.id === item.category)?.name,
      subCategory: item.subCategory,
      consumptionRate: item.consumptionRate
    })));
    
    return foodItems;
  }, [state.expenses]);

  // 使用可能な作り置きを取得（消費率が100%未満のもの）
  const availableMealPrepItems = useMemo(() => {
    return state.mealPrepItems
      .filter(item => item.consumptionRate < 100)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.mealPrepItems]);

  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  // 消費率を更新
  const handleConsumptionChange = (expenseId: string, newRate: number) => {
    setConsumptionUpdates(prev => ({
      ...prev,
      [expenseId]: newRate
    }));
  };

  // 作り置きの消費率を更新
  const handleMealPrepConsumptionChange = (itemId: string, newRate: number) => {
    setMealPrepConsumptionUpdates(prev => ({
      ...prev,
      [itemId]: newRate
    }));
  };

  // 作り置きを削除
  const handleDeleteMealPrep = async (itemId: string, itemName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${itemName}"?\n\n※ The consumption rate of ingredients used in this meal prep will also be reset.`);
    
    if (confirmed) {
      try {
        await deleteMealPrepItem(itemId);
        alert(`"${itemName}" has been deleted.\nThe consumption rate of ingredients has also been reset.`);
      } catch (error) {
        console.error('作り置き削除エラー:', error);
        alert('Failed to delete meal prep');
      }
    }
  };

  // 未使用状態を切り替え
  const handleUnusedToggle = (unused: boolean) => {
    setIsUnused(unused);
    if (unused) {
      // 未使用を選択した場合、消費率更新をクリア
      setConsumptionUpdates({});
      setMealPrepConsumptionUpdates({});
    }
  };

  // 食事ログを保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isUnused && Object.keys(consumptionUpdates).length === 0 && Object.keys(mealPrepConsumptionUpdates).length === 0) {
      alert('Please update the consumption rate for at least one ingredient or meal prep item if using ingredients.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 食材を使用する場合のみ消費率を更新
      if (!isUnused && Object.keys(consumptionUpdates).length > 0) {
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
      }

      // 選択された作り置きの消費率を更新
      if (Object.keys(mealPrepConsumptionUpdates).length > 0) {
        await Promise.all(
          Object.entries(mealPrepConsumptionUpdates).map(async ([itemId, additionalRate]) => {
            const mealPrepItem = state.mealPrepItems.find(item => item.id === itemId);
            if (mealPrepItem) {
              const newConsumptionRate = Math.min(100, mealPrepItem.consumptionRate + additionalRate);
              await updateMealPrepItem({
                ...mealPrepItem,
                consumptionRate: newConsumptionRate,
                isUsed: newConsumptionRate >= 100
              });
            }
          })
        );
      }

      // 食事ログを保存
      await addMealLog({
        date: selectedDate,
        mealType: selectedMealType,
        ingredients: isUnused ? [] : Object.entries(consumptionUpdates).map(([id, usedRate]) => ({ id, usedRate })),
        ...(Object.keys(mealPrepConsumptionUpdates).length > 0 ? { mealPrepItems: Object.keys(mealPrepConsumptionUpdates) } : {}),
        ...(mealNotes ? { notes: mealNotes } : {}),
        createdAt: new Date().toISOString(),
      });

      // 成功メッセージを表示してリセット
      const statusMessage = isUnused ? '(No ingredients used)' : '';
      alert(`${selectedMealType} has been recorded${statusMessage}`);
      setConsumptionUpdates({});
      setMealPrepConsumptionUpdates({});
      setMealNotes('');
      setIsUnused(false);

    } catch (error) {
      console.error('食事ログ保存エラー:', error);
      alert('Failed to save meal log');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 消費率の選択肢（10%単位）
  const consumptionOptions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="meal-log-input">
      <div className="meal-log-input-container">
        <header className="meal-log-input-header">
          <h1>Meal Log Input</h1>
          <p>Record the consumption rate of used ingredients</p>
        </header>

        <form onSubmit={handleSubmit} className="meal-form">
          {/* 日付と食事タイプ選択 */}
          <div className="meal-basic-info">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Meal Type</label>
              <div className="meal-type-buttons">
                {mealTypes.map((mealType) => (
                  <button
                    key={mealType}
                    type="button"
                    className={`meal-type-button ${selectedMealType === mealType ? 'active' : ''}`}
                    onClick={() => setSelectedMealType(mealType)}
                  >
                    {mealType}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 食材使用状況選択 */}
          <div className="usage-mode-section">
            <h3>Ingredient Usage</h3>
            <div className="usage-mode-buttons">
              <button
                type="button"
                className={`usage-mode-button ${!isUnused ? 'active' : ''}`}
                onClick={() => handleUnusedToggle(false)}
              >
                Use Ingredients
              </button>
              <button
                type="button"
                className={`usage-mode-button ${isUnused ? 'active' : ''}`}
                onClick={() => handleUnusedToggle(true)}
              >
                No Ingredients Used
              </button>
            </div>
          </div>

          {/* 食材消費率入力（食材使用時のみ表示） */}
          {!isUnused && (
            <>
              {/* 作り置き選択 */}
              {availableMealPrepItems.length > 0 && (
                <div className="meal-prep-section">
                  <h3>Use Meal Prep ({availableMealPrepItems.length})</h3>
                  <div className="meal-prep-grid">
                    {availableMealPrepItems.map((item) => {
                      const currentConsumption = item.consumptionRate;
                      const additionalConsumption = mealPrepConsumptionUpdates[item.id] || 0;
                      const totalConsumption = Math.min(100, currentConsumption + additionalConsumption);
                      
                      return (
                        <div key={item.id} className="meal-prep-item">
                          <button
                            type="button"
                            className="delete-meal-prep-button"
                            onClick={() => handleDeleteMealPrep(item.id, item.name)}
                            title="削除"
                          >
                            🗑️
                          </button>
                          
                          <div className="meal-prep-info">
                            <h4>{item.name}</h4>
                            <p className="meal-prep-meta">
                              Created: {item.date} | Current: {currentConsumption}%
                            </p>
                            {item.notes && (
                              <p className="meal-prep-notes">{item.notes}</p>
                            )}
                            
                            <div className="consumption-display">
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
                                Total: {totalConsumption}%
                              </span>
                            </div>
                          </div>

                          <div className="consumption-input">
                            <label>Usage This Time</label>
                            <div className="consumption-buttons">
                              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
                                .filter(option => option <= 100 - currentConsumption)
                                .map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  className={`consumption-button ${additionalConsumption === option ? 'active' : ''}`}
                                  onClick={() => handleMealPrepConsumptionChange(item.id, option)}
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
                </div>
              )}

              <div className="ingredients-section">
                <div className="section-header">
                  <h3>Enter Consumption Rate for Ingredients ({availableFoodItems.length})</h3>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('MealLogInput - 強制更新ボタンクリック');
                      console.log('MealLogInput - 現在のstate.expenses:', state.expenses.length, '件');
                      
                      // 全明細の詳細を確認
                      const allExpenses = state.expenses.map(item => ({
                        id: item.id,
                        description: item.description,
                        category: item.category,
                        subCategory: item.subCategory,
                        consumptionRate: item.consumptionRate
                      }));
                      console.log('MealLogInput - 全明細詳細:', allExpenses);
                      
                      // kitchen明細のみを確認（カテゴリー名でフィルタリング）
                      const kitchenExpenses = state.expenses.filter(expense => {
                        if (!expense.category) return false;
                        const category = state.categories.find(c => c.id === expense.category);
                        return category?.name === 'kitchen';
                      });
                      console.log('MealLogInput - kitchen明細詳細:', kitchenExpenses.map(item => ({
                        id: item.id,
                        description: item.description,
                        category: item.category,
                        categoryName: state.categories.find(c => c.id === item.category)?.name,
                        subCategory: item.subCategory,
                        consumptionRate: item.consumptionRate
                      })));
                    }}
                    className="refresh-button"
                    style={{ 
                      padding: '4px 8px', 
                      fontSize: '12px', 
                      backgroundColor: '#f0f0f0', 
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    データ更新確認
                  </button>
                </div>
              
              {availableFoodItems.length === 0 ? (
                <div className="no-ingredients">
                  <p>No available ingredients</p>
                  <p>Please record ingredients in the "kitchen" category first</p>
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
                            ¥{item.amount.toLocaleString('en-US')} | {item.date}
                          </p>
                          
                          <div className="consumption-display">
                            <span>Current: {currentConsumption}%</span>
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
                              Total: {totalConsumption}%
                            </span>
                          </div>
                        </div>

                        <div className="consumption-input">
                          <label>Usage This Time</label>
                          <div className="consumption-buttons">
                            {consumptionOptions
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
            </>
          )}

          {/* 未使用時のメッセージ */}
          {isUnused && (
            <div className="unused-message">
              <p>✨ This meal will be recorded as not using any ingredients</p>
              <p>Use for eating out or buying a bento, etc.</p>
            </div>
          )}

          {/* メモ入力 */}
          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              value={mealNotes}
              onChange={(e) => setMealNotes(e.target.value)}
              placeholder={isUnused ? "Record details such as restaurant or bento..." : "Record meal details or recipes..."}
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
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || (!isUnused && Object.keys(consumptionUpdates).length === 0 && Object.keys(mealPrepConsumptionUpdates).length === 0)}
            >
              {isSubmitting ? 'Recording...' : `Record ${selectedMealType}`}
            </button>
          </div>
        </form>

        {/* 使用ガイド */}
        <div className="usage-guide">
          <h3>◆ Usage Guide</h3>
          <ul>
            <li><strong>Use Ingredients</strong>: Record the consumption rate of ingredients at home in 10% increments</li>
            <li><strong>Use Meal Prep</strong>: Record the consumption rate of pre-made dishes in 10% increments (hidden when 100% consumed)</li>
            <li><strong>Delete Meal Prep</strong>: Deleting a meal prep will also reset the consumption rate of used ingredients</li>
            <li><strong>No Ingredients Used</strong>: Select when eating out or buying a bento</li>
            <li>You can record multiple ingredients and meal preps at once</li>
            <li>Ingredients with 100% consumption will not be shown next time</li>
            <li>You can manage records by meal type</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MealLogInput; 