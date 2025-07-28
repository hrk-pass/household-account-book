import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import type { FoodItem } from '../types';
import './MealPrepInput.css';

const MealPrepInput: React.FC = () => {
  const navigate = useNavigate();
  const { state, addMealPrepItem, updateExpense } = useExpense();
  
  // コンポーネントマウント時のデバッグ
  React.useEffect(() => {
    console.log('MealPrepInput - コンポーネントマウント');
    console.log('MealPrepInput - 初期state.expenses:', state.expenses.length, '件');
  }, []);
  
  // state.expensesの変更を監視
  React.useEffect(() => {
    console.log('MealPrepInput - state.expenses変更検知:', state.expenses.length, '件');
  }, [state.expenses]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [mealPrepName, setMealPrepName] = useState('');
  const [notes, setNotes] = useState('');
  const [consumptionUpdates, setConsumptionUpdates] = useState<{ [expenseId: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 使用可能な食材を取得（消費率が100%未満の食材）
  const availableFoodItems = useMemo(() => {
    console.log('MealPrepInput - useMemo実行開始');
    console.log('MealPrepInput - state.expenses:', state.expenses.length, '件');
    
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
    console.log('MealPrepInput - 全kitchen明細:', kitchenExpenses.length);
    console.log('MealPrepInput - 全kitchen明細詳細:', kitchenExpenses.map(item => ({
      id: item.id,
      description: item.description,
      category: item.category,
      categoryName: state.categories.find(c => c.id === item.category)?.name,
      subCategory: item.subCategory,
      consumptionRate: item.consumptionRate
    })));
    console.log('MealPrepInput - 食材サブカテゴリー明細:', foodItems.length);
    console.log('MealPrepInput - 食材明細詳細:', foodItems.map(item => ({
      id: item.id,
      description: item.description,
      subCategory: item.subCategory,
      consumptionRate: item.consumptionRate
    })));
    
    // 全明細の詳細も確認
    console.log('MealPrepInput - 全明細詳細:', state.expenses.map(item => ({
      id: item.id,
      description: item.description,
      category: item.category,
      categoryName: state.categories.find(c => c.id === item.category)?.name,
      subCategory: item.subCategory,
      consumptionRate: item.consumptionRate
    })));
    
    return foodItems;
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
      alert('Please enter a name for the meal prep');
      return;
    }

    if (Object.keys(consumptionUpdates).length === 0) {
      alert('Please update the consumption rate for at least one ingredient');
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
      alert(`${mealPrepName} meal prep has been recorded`);
      setMealPrepName('');
      setNotes('');
      setConsumptionUpdates({});

    } catch (error) {
      console.error('作り置き保存エラー:', error);
      alert('Failed to save meal prep');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="meal-prep-input">
      <div className="meal-prep-input-container">
        <header className="meal-prep-input-header">
          <h1>Meal Prep Input</h1>
          <p>Record pre-made dishes</p>
        </header>

        <form onSubmit={handleSubmit} className="meal-prep-form">
          {/* 基本情報 */}
          <div className="meal-prep-basic-info">
            <div className="form-group">
              <label htmlFor="name">Meal Prep Name *</label>
              <input
                type="text"
                id="name"
                value={mealPrepName}
                onChange={(e) => setMealPrepName(e.target.value)}
                placeholder="e.g. Curry, Miso Soup, Rice Ball"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Meal Prep Date</label>
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
            <div className="section-header">
              <h3>Enter Consumption Rate for Ingredients ({availableFoodItems.length})</h3>
              <button
                type="button"
                onClick={() => {
                  console.log('MealPrepInput - 強制更新ボタンクリック');
                  console.log('MealPrepInput - 現在のstate.expenses:', state.expenses.length, '件');
                  
                  // 全明細の詳細を確認
                  const allExpenses = state.expenses.map(item => ({
                    id: item.id,
                    description: item.description,
                    category: item.category,
                    subCategory: item.subCategory,
                    consumptionRate: item.consumptionRate
                  }));
                  console.log('MealPrepInput - 全明細詳細:', allExpenses);
                  
                  // kitchen明細のみを確認（カテゴリー名でフィルタリング）
                  const kitchenExpenses = state.expenses.filter(expense => {
                    if (!expense.category) return false;
                    const category = state.categories.find(c => c.id === expense.category);
                    return category?.name === 'kitchen';
                  });
                  console.log('MealPrepInput - kitchen明細詳細:', kitchenExpenses.map(item => ({
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
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record recipes, storage methods, notes, etc..."
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
              disabled={isSubmitting || !mealPrepName.trim() || Object.keys(consumptionUpdates).length === 0}
            >
              {isSubmitting ? 'Recording...' : 'Record Meal Prep'}
            </button>
          </div>
        </form>

        {/* 使用ガイド */}
        <div className="usage-guide">
          <h3>◆ Usage Guide</h3>
          <ul>
            <li><strong>Meal Prep Name</strong>: Enter the name of the dish (e.g. Curry, Miso Soup)</li>
            <li><strong>Ingredient Consumption Rate</strong>: Record the consumption rate of used ingredients in 10% increments</li>
            <li>Meal preps can be selected when inputting meals</li>
            <li>Ingredient consumption rates are updated when creating meal preps</li>
            <li>Meal prep consumption rates can be recorded when inputting meals</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MealPrepInput; 