import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Expense, Category, MealLog, MealPrepItem } from '../types';

// 共通のコレクション名を取得
const getCollection = (collectionName: string) => {
  return collection(db, collectionName);
};

// 支出関連の操作
export const expenseService = {
  // 支出を追加
  async addExpense(expense: Omit<Expense, 'id'>): Promise<string> {
    try {
      const expenseWithTimestamp = {
        ...expense,
        date: Timestamp.fromDate(new Date(expense.date))
      };
      const docRef = await addDoc(getCollection('expenses'), expenseWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('支出追加エラー:', error);
      throw error;
    }
  },

  // 支出を更新
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      const expenseDoc = doc(getCollection('expenses'), expenseId);
      const updatesWithTimestamp = updates.date 
        ? { ...updates, date: Timestamp.fromDate(new Date(updates.date)) }
        : updates;
      
      console.log('Firestore updateExpense - 更新対象ID:', expenseId);
      console.log('Firestore updateExpense - 更新内容:', updatesWithTimestamp);
      console.log('Firestore updateExpense - 更新前のドキュメントパス:', expenseDoc.path);
      
      await updateDoc(expenseDoc, updatesWithTimestamp);
      console.log('Firestore updateExpense - 更新完了:', expenseId);
      
      // 更新後の確認（オプション）
      setTimeout(async () => {
        try {
          const updatedDoc = await getDocs(query(
            getCollection('expenses'),
            orderBy('date', 'desc')
          ));
          const updatedExpense = updatedDoc.docs.find(doc => doc.id === expenseId);
          if (updatedExpense) {
            const data = updatedExpense.data();
            console.log('Firestore updateExpense - 更新後の確認:', {
              id: expenseId,
              subCategory: data.subCategory,
              description: data.description
            });
          }
        } catch (error) {
          console.error('Firestore updateExpense - 更新後確認エラー:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('支出更新エラー:', error);
      throw error;
    }
  },

  // 支出を削除
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const expenseDoc = doc(getCollection('expenses'), expenseId);
      await deleteDoc(expenseDoc);
    } catch (error) {
      console.error('支出削除エラー:', error);
      throw error;
    }
  },

  // 支出一覧を取得
  async getExpenses(): Promise<Expense[]> {
    try {
      const q = query(
        getCollection('expenses'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString().split('T')[0] // Timestampを文字列に変換
        } as Expense;
      });
    } catch (error) {
      console.error('支出取得エラー:', error);
      throw error;
    }
  },

  // リアルタイムで支出を監視
  subscribeToExpenses(callback: (expenses: Expense[]) => void): () => void {
    const q = query(
      getCollection('expenses'),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('Firestore リアルタイム監視 - スナップショット受信:', querySnapshot.docs.length, '件');
      
      const expenses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString().split('T')[0]
        } as Expense;
      });
      
      // デバッグ情報
      const kitchenExpenses = expenses.filter(expense => {
        const category = expense.category;
        return category === 'kitchen';
      });
      console.log('Firestore リアルタイム監視 - 全明細:', expenses.length);
      console.log('Firestore リアルタイム監視 - kitchen明細:', kitchenExpenses.length);
      console.log('Firestore リアルタイム監視 - kitchen明細詳細:', kitchenExpenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        subCategory: expense.subCategory,
        consumptionRate: expense.consumptionRate
      })));
      
      // 更新された明細を特定
      const updatedExpenses = expenses.filter(expense => 
        expense.subCategory === '食材' && 
        kitchenExpenses.some(kitchen => kitchen.id === expense.id)
      );
      console.log('Firestore リアルタイム監視 - 食材サブカテゴリー明細:', updatedExpenses.length);
      console.log('Firestore リアルタイム監視 - 食材明細詳細:', updatedExpenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        subCategory: expense.subCategory,
        consumptionRate: expense.consumptionRate
      })));
      
      callback(expenses);
    }, (error) => {
      console.error('支出監視エラー:', error);
    });

    return unsubscribe;
  }
};

// カテゴリ関連の操作
export const categoryService = {
  // カテゴリを追加
  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(getCollection('categories'), category);
      return docRef.id;
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
      throw error;
    }
  },

  // カテゴリを更新
  async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    try {
      const categoryDoc = doc(getCollection('categories'), categoryId);
      await updateDoc(categoryDoc, updates);
    } catch (error) {
      console.error('カテゴリ更新エラー:', error);
      throw error;
    }
  },

  // カテゴリを削除
  async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryDoc = doc(getCollection('categories'), categoryId);
      await deleteDoc(categoryDoc);
    } catch (error) {
      console.error('カテゴリ削除エラー:', error);
      throw error;
    }
  },

  // カテゴリ一覧を取得
  async getCategories(): Promise<Category[]> {
    try {
      const querySnapshot = await getDocs(getCollection('categories'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
    } catch (error) {
      console.error('カテゴリ取得エラー:', error);
      throw error;
    }
  },

  // リアルタイムでカテゴリを監視
  subscribeToCategories(callback: (categories: Category[]) => void): () => void {
    const unsubscribe = onSnapshot(
      getCollection('categories'),
      (querySnapshot) => {
        const categories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        callback(categories);
      },
      (error) => {
        console.error('カテゴリ監視エラー:', error);
      }
    );

    return unsubscribe;
  },

  // デフォルトカテゴリを初期化
  async initializeDefaultCategories(): Promise<void> {
    try {
      const existingCategories = await this.getCategories();
      if (existingCategories.length > 0) {
        return; // 既にカテゴリが存在する場合は何もしない
      }

      const defaultCategories = [
        { name: '食費', color: '#FF6B6B' },
        { name: '交通費', color: '#4ECDC4' },
        { name: '娯楽', color: '#45B7D1' },
        { name: '日用品', color: '#96CEB4' },
        { name: 'kitchen', color: '#FF8C69' },
        { name: 'その他', color: '#FCEA2B' }
      ];

      await Promise.all(
        defaultCategories.map(category => this.addCategory(category))
      );
    } catch (error) {
      console.error('デフォルトカテゴリ初期化エラー:', error);
      throw error;
    }
  }
};

// 食事ログ関連の操作
export const mealLogService = {
  // 食事ログを追加
  async addMealLog(mealLog: Omit<MealLog, 'id'>): Promise<string> {
    try {
      const mealLogWithTimestamp = {
        ...mealLog,
        date: Timestamp.fromDate(new Date(mealLog.date))
      };
      const docRef = await addDoc(getCollection('mealLogs'), mealLogWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('食事ログ追加エラー:', error);
      throw error;
    }
  },

  // 食事ログを更新
  async updateMealLog(mealLogId: string, updates: Partial<MealLog>): Promise<void> {
    try {
      const mealLogDoc = doc(getCollection('mealLogs'), mealLogId);
      const updatesWithTimestamp = updates.date 
        ? { ...updates, date: Timestamp.fromDate(new Date(updates.date)) }
        : updates;
      await updateDoc(mealLogDoc, updatesWithTimestamp);
    } catch (error) {
      console.error('食事ログ更新エラー:', error);
      throw error;
    }
  },

  // 食事ログを削除
  async deleteMealLog(mealLogId: string): Promise<void> {
    try {
      const mealLogDoc = doc(getCollection('mealLogs'), mealLogId);
      await deleteDoc(mealLogDoc);
    } catch (error) {
      console.error('食事ログ削除エラー:', error);
      throw error;
    }
  },

  // 食事ログ一覧を取得
  async getMealLogs(): Promise<MealLog[]> {
    try {
      const q = query(
        getCollection('mealLogs'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString().split('T')[0] // Timestampを文字列に変換
        } as MealLog;
      });
    } catch (error) {
      console.error('食事ログ取得エラー:', error);
      throw error;
    }
  },

  // リアルタイムで食事ログを監視
  subscribeToMealLogs(callback: (mealLogs: MealLog[]) => void): () => void {
    const q = query(
      getCollection('mealLogs'),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mealLogs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString().split('T')[0]
        } as MealLog;
      });
      callback(mealLogs);
    }, (error) => {
      console.error('食事ログ監視エラー:', error);
    });

    return unsubscribe;
  }
};

// 作り置き関連の操作
export const mealPrepService = {
  // 作り置きを追加
  async addMealPrepItem(mealPrepItem: Omit<MealPrepItem, 'id'>): Promise<string> {
    try {
      const mealPrepItemWithTimestamp = {
        ...mealPrepItem,
        date: Timestamp.fromDate(new Date(mealPrepItem.date))
      };
      const docRef = await addDoc(getCollection('mealPrepItems'), mealPrepItemWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('作り置き追加エラー:', error);
      throw error;
    }
  },

  // 作り置きを更新
  async updateMealPrepItem(mealPrepItemId: string, updates: Partial<MealPrepItem>): Promise<void> {
    try {
      const mealPrepItemDoc = doc(getCollection('mealPrepItems'), mealPrepItemId);
      const updatesWithTimestamp = updates.date 
        ? { ...updates, date: Timestamp.fromDate(new Date(updates.date)) }
        : updates;
      await updateDoc(mealPrepItemDoc, updatesWithTimestamp);
    } catch (error) {
      console.error('作り置き更新エラー:', error);
      throw error;
    }
  },

  // 作り置きを削除
  async deleteMealPrepItem(mealPrepItemId: string): Promise<void> {
    try {
      const mealPrepItemDoc = doc(getCollection('mealPrepItems'), mealPrepItemId);
      await deleteDoc(mealPrepItemDoc);
    } catch (error) {
      console.error('作り置き削除エラー:', error);
      throw error;
    }
  },

  // 作り置き一覧を取得
  async getMealPrepItems(): Promise<MealPrepItem[]> {
    try {
      const q = query(
        getCollection('mealPrepItems'),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString().split('T')[0] // Timestampを文字列に変換
        } as MealPrepItem;
      });
    } catch (error) {
      console.error('作り置き取得エラー:', error);
      throw error;
    }
  },

  // リアルタイムで作り置きを監視
  subscribeToMealPrepItems(callback: (mealPrepItems: MealPrepItem[]) => void): () => void {
    const q = query(
      getCollection('mealPrepItems'),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mealPrepItems = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate().toISOString().split('T')[0]
        } as MealPrepItem;
      });
      callback(mealPrepItems);
    }, (error) => {
      console.error('作り置き監視エラー:', error);
    });

    return unsubscribe;
  }
}; 