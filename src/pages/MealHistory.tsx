import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import './MealHistory.css';

import type { MealLog } from '../types';

type MealData = {
  id: string;
  date: string;
  mealType: string;
  ingredients: string[];
  notes?: string;
};

const MealHistory = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mealDates, setMealDates] = useState<Set<string>>(new Set());
  const [selectedDateMeals, setSelectedDateMeals] = useState<MealData[]>([]);
  const auth = getAuth();

  // Firestoreのタイムスタンプを日付文字列（YYYY-MM-DD）に変換する関数
  const convertTimestampToDateString = (timestamp: any): string => {
    if (!timestamp || !timestamp.seconds) return '';
    const date = new Date(timestamp.seconds * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
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

    fetchMealDates();
  }, [auth.currentUser]);

  useEffect(() => {
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
            notes: data.notes
          });
        });
        
        console.log('処理後の食事記録:', meals);
        setSelectedDateMeals(meals);
      } catch (error) {
        console.error('日付別食事記録の取得中にエラーが発生:', error);
      }
    };

    fetchMealsForDate();
  }, [selectedDate, auth.currentUser]);

  const handleDateChange = (value: any, event: React.MouseEvent<HTMLButtonElement>) => {
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
    console.log('未認証状態でのレンダリング');
    return (
      <div className="meal-history">
        <div className="meal-history-container">
          <header className="meal-history-header">
            <h2>ログインが必要です</h2>
            <p>食事履歴を表示するにはログインしてください。</p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-history">
      <div className="meal-history-container">
        <header className="meal-history-header">
          <h2>食事履歴</h2>
          <p>カレンダーで食事記録を確認</p>
        </header>

        <div className="calendar-container">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            locale="ja-JP"
          />
        </div>
        
        <div className="meal-details">
          <h3>{selectedDate.toLocaleDateString('ja-JP')}の食事</h3>
          {selectedDateMeals.length > 0 ? (
            <ul className="meal-list">
              {selectedDateMeals.map((meal) => (
                <li key={meal.id} className="meal-item">
                  <div>
                    <strong>{meal.mealType}</strong>
                    {meal.notes && <span>: {meal.notes}</span>}
                  </div>
                  <div>
                    {meal.ingredients.length > 0 ? 
                      `使用食材: ${meal.ingredients.length}個` : 
                      '食材未使用'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>この日の記録はありません</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealHistory; 