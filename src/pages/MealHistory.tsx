import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import { mealLogService } from '../lib/firestore';
import { useExpense } from '../contexts/ExpenseContext';
import './MealHistory.css';

type MealData = {
  id: string;
  date: string;
  mealType: string;
  ingredients: { id: string; usedRate: number }[];
  mealPrepItems?: string[];
  notes?: string;
};

const MealHistory = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealDates, setMealDates] = useState<Set<string>>(new Set());
  const [selectedDateMeals, setSelectedDateMeals] = useState<MealData[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const auth = getAuth();
  const { state, updateExpense, updateMealPrepItem } = useExpense();

  // Firestoreのタイムスタンプを日付文字列（YYYY-MM-DD）に変換する関数
  const convertTimestampToDateString = (timestamp: any): string => {
    if (!timestamp || !timestamp.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 食事記録を削除する関数（消費率も戻す）
  const handleDeleteMeal = async (mealId: string) => {
    if (!auth.currentUser) {
      alert('Login required');
      return;
    }

    try {
      // 削除する食事記録の詳細を取得
      const mealToDelete = selectedDateMeals.find(meal => meal.id === mealId);
      if (!mealToDelete) {
        console.error('削除する食事記録が見つかりません');
        return;
      }

      // 食材の消費率を戻す
      if (mealToDelete.ingredients && mealToDelete.ingredients.length > 0) {
        for (const ingredient of mealToDelete.ingredients) {
          const expense = state.expenses.find(e => e.id === ingredient.id);
          if (expense && expense.consumptionRate !== undefined) {
            const newConsumptionRate = Math.max(0, expense.consumptionRate - ingredient.usedRate);
            await updateExpense({
              ...expense,
              consumptionRate: newConsumptionRate
            });
          }
        }
      }

      // 作り置きの消費率を戻す
      if (mealToDelete.mealPrepItems && mealToDelete.mealPrepItems.length > 0) {
        for (const mealPrepId of mealToDelete.mealPrepItems) {
          const mealPrepItem = state.mealPrepItems.find(item => item.id === mealPrepId);
          if (mealPrepItem) {
            const newConsumptionRate = Math.max(0, mealPrepItem.consumptionRate - 10);
            await updateMealPrepItem({
              ...mealPrepItem,
              consumptionRate: newConsumptionRate,
              isUsed: newConsumptionRate >= 100
            });
          }
        }
      }

      // 食事記録を削除
      await mealLogService.deleteMealLog(mealId);
      setDeleteConfirm(null);
      
      // 削除後にデータを再取得
      fetchMealDates();
      fetchMealsForDate();
      
      alert('Meal log deleted and consumption rate restored');
    } catch (error) {
      console.error('食事記録の削除中にエラーが発生:', error);
      alert('Failed to delete');
    }
  };

  // 削除確認ダイアログを表示する関数
  const showDeleteConfirm = (mealId: string) => {
    setDeleteConfirm(mealId);
  };

  // 削除確認をキャンセルする関数
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const fetchMealDates = async () => {
    if (!auth.currentUser) {
      console.log('ユーザーが認証されていません');
      return;
    }
    
    console.log('ユーザーID:', auth.currentUser.uid);
    const mealsRef = collection(db, `users/${auth.currentUser.uid}/mealLogs`);
    console.log('コレクションパス:', `users/${auth.currentUser.uid}/mealLogs`);
    
    try {
      const querySnapshot = await getDocs(mealsRef);
      console.log('取得した食事記録の数:', querySnapshot.size);
      
      const dates = new Set<string>();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('食事記録データ:', data);
        const dateStr = convertTimestampToDateString(data.date);
        if (dateStr) {
          dates.add(dateStr);
        }
      });
      
      console.log('記録のある日付一覧:', Array.from(dates));
      setMealDates(dates);
    } catch (error) {
      console.error('食事記録の取得中にエラーが発生:', error);
    }
  };

  const fetchMealsForDate = async () => {
    if (!auth.currentUser) {
      console.log('ユーザーが認証されていません（日付別取得）');
      return;
    }

    // 選択された日付の開始と終了のタイムスタンプを作成
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    
    const startOfDay = new Date(year, month, day, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
    
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    console.log('検索範囲:', {
      start: convertTimestampToDateString(startTimestamp),
      end: convertTimestampToDateString(endTimestamp)
    });
    
    const mealsRef = collection(db, `users/${auth.currentUser.uid}/mealLogs`);
    const q = query(
      mealsRef,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      console.log('選択日の食事記録数:', querySnapshot.size);
      
      const meals: MealData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('取得した食事記録:', data);
        meals.push({
          id: doc.id,
          date: convertTimestampToDateString(data.date),
          mealType: data.mealType,
          ingredients: data.ingredients || [],
          mealPrepItems: data.mealPrepItems || [],
          notes: data.notes
        });
      });
      
      console.log('処理後の食事記録:', meals);
      setSelectedDateMeals(meals);
    } catch (error) {
      console.error('日付別食事記録の取得中にエラーが発生:', error);
    }
  };

  useEffect(() => {
    fetchMealDates();
  }, [auth.currentUser]);

  useEffect(() => {
    fetchMealsForDate();
  }, [selectedDate, auth.currentUser]);

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      console.log('日付変更:', `${year}-${month}-${day}`);
      setSelectedDate(value);
    }
  };

  const tileContent = ({ date }: { date: Date }) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    if (mealDates.has(dateString)) {
      return <div className="meal-indicator" />;
    }
    return null;
  };

  if (!auth.currentUser) {
    console.log('Rendering in unauthenticated state');
    return (
      <div className="meal-history">
        <div className="meal-history-container">
          <header className="meal-history-header">
            <h2>Login required</h2>
            <p>Please log in to view meal history.</p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-history">
      <div className="meal-history-container">
        <header className="meal-history-header">
          <h2>Meal History</h2>
          <p>Check meal records with the calendar</p>
        </header>

        <div className="calendar-container">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            locale="en-US"
          />
        </div>
        
        <div className="meal-details">
          <h3>{selectedDate.toLocaleDateString('en-US')} Meals</h3>
          {selectedDateMeals.length > 0 ? (
            <ul className="meal-list">
              {selectedDateMeals.map((meal) => (
                <li key={meal.id} className="meal-item">
                  <div className="meal-content">
                    <div>
                      <strong>{meal.mealType}</strong>
                      {meal.notes && <span>: {meal.notes}</span>}
                    </div>
                    <div>
                      {meal.mealPrepItems && meal.mealPrepItems.length > 0 ? 
                        `Meal Prep Used: ${meal.mealPrepItems.length}` : 
                        meal.ingredients.length > 0 ? 
                          `Ingredients Used: ${meal.ingredients.length}` : 
                          'No ingredients used'}
                    </div>
                  </div>
                  <div className="meal-actions">
                    <button
                      className="delete-btn"
                      onClick={() => showDeleteConfirm(meal.id)}
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No records for this day</p>
          )}
        </div>

        {/* 削除確認ダイアログ */}
        {deleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-dialog">
              <h3>Delete Confirmation</h3>
              <p>Are you sure you want to delete this meal log?</p>
              <p>Deleting will also restore the consumption rate of used ingredients and meal preps.</p>
              <p>This action cannot be undone.</p>
              <div className="delete-confirm-buttons">
                <button
                  className="cancel-btn"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button
                  className="confirm-delete-btn"
                  onClick={() => handleDeleteMeal(deleteConfirm)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealHistory; 