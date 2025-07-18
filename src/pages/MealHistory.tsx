import React, { useState, useMemo } from 'react';
import { useExpense } from '../contexts/ExpenseContext';
import type { MealType, MealLog } from '../types';
import './MealHistory.css';

const MealHistory: React.FC = () => {
  const { state } = useExpense();
  const [selectedMealType, setSelectedMealType] = useState<MealType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState('');

  // 食事ログをフィルタリング
  const filteredMealLogs = useMemo(() => {
    let logs = state.mealLogs;

    // 食事タイプでフィルタリング
    if (selectedMealType !== 'all') {
      logs = logs.filter(log => log.mealType === selectedMealType);
    }

    // 日付でフィルタリング
    if (selectedDate) {
      logs = logs.filter(log => log.date === selectedDate);
    }

    return logs;
  }, [state.mealLogs, selectedMealType, selectedDate]);

  // 使用した食材の詳細を取得
  const getIngredientDetails = (ingredientIds: string[]) => {
    return ingredientIds
      .map(id => state.expenses.find(expense => expense.id === id))
      .filter(expense => expense !== undefined);
  };

  // 日付でグループ化
  const groupedLogs = useMemo(() => {
    const groups: { [date: string]: MealLog[] } = {};
    filteredMealLogs.forEach(log => {
      if (!groups[log.date]) {
        groups[log.date] = [];
      }
      groups[log.date].push(log);
    });
    
    // 日付順でソート（新しい順）
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const sortedGroups: { [date: string]: MealLog[] } = {};
    sortedDates.forEach(date => {
      // 各日付内で食事タイプ順にソート
      const mealTypeOrder: { [key in MealType]: number } = {
        '朝食': 1,
        '昼食': 2,
        '夕食': 3,
        '間食': 4
      };
      groups[date].sort((a, b) => mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType]);
      sortedGroups[date] = groups[date];
    });
    
    return sortedGroups;
  }, [filteredMealLogs]);

  const mealTypes: (MealType | 'all')[] = ['all', '朝食', '昼食', '夕食', '間食'];

  // 日付をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return '今日';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  // 食事タイプのアイコン
  const getMealIcon = (mealType: MealType) => {
    const icons = {
      '朝食': '🌅',
      '昼食': '☀️',
      '夕食': '🌙',
      '間食': '🍪'
    };
    return icons[mealType];
  };

  return (
    <div className="meal-history">
      <div className="meal-history-container">
        <header className="meal-history-header">
          <h1>食事記録</h1>
          <p>これまでの食事履歴を確認</p>
        </header>

        {/* フィルター */}
        <div className="meal-filters">
          <div className="filter-group">
            <label>食事タイプ</label>
            <div className="meal-type-filter">
              {mealTypes.map((mealType) => (
                <button
                  key={mealType}
                  className={`filter-button ${selectedMealType === mealType ? 'active' : ''}`}
                  onClick={() => setSelectedMealType(mealType)}
                >
                  {mealType === 'all' ? '全て' : mealType}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="date-filter">日付</label>
            <input
              type="date"
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-filter"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="clear-date-button"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* 食事記録一覧 */}
        <div className="meal-logs">
          {Object.keys(groupedLogs).length === 0 ? (
            <div className="no-logs">
              <p>食事記録がありません</p>
              <p>食事入力画面から記録を始めましょう</p>
            </div>
          ) : (
            Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date} className="date-group">
                <h3 className="date-header">
                  {formatDate(date)} ({date})
                </h3>
                
                <div className="meal-cards">
                  {logs.map((log) => {
                    const ingredients = getIngredientDetails(log.ingredients);
                    
                    return (
                      <div key={log.id} className="meal-card">
                        <div className="meal-card-header">
                          <h4>
                            <span className="meal-icon">{getMealIcon(log.mealType)}</span>
                            {log.mealType}
                          </h4>
                          <span className="meal-time">
                            {new Date(log.createdAt).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="meal-content">
                          {ingredients.length > 0 && (
                            <div className="ingredients-section">
                              <h5>使用した食材</h5>
                              <div className="ingredients-list">
                                {ingredients.map((ingredient) => (
                                  <div key={ingredient.id} className="ingredient-item">
                                    <span className="ingredient-name">
                                      {ingredient.description}
                                    </span>
                                    <span className="ingredient-price">
                                      ¥{ingredient.amount.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.notes && (
                            <div className="notes-section">
                              <h5>メモ</h5>
                              <p className="meal-notes">{log.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 統計情報 */}
        {filteredMealLogs.length > 0 && (
          <div className="meal-stats">
            <h3>統計情報</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{filteredMealLogs.length}</span>
                <span className="stat-label">食事記録</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{Object.keys(groupedLogs).length}</span>
                <span className="stat-label">記録日数</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {filteredMealLogs.reduce((total, log) => total + log.ingredients.length, 0)}
                </span>
                <span className="stat-label">使用食材数</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealHistory; 