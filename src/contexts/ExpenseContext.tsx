import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { AppState, AppAction, Expense, Category, MealLog, MealPrepItem } from '../types';
import { auth } from '../lib/firebase';
import { expenseService, categoryService, mealLogService, mealPrepService } from '../lib/firestore';

// 初期状態
const initialState: AppState = {
  expenses: [],
  categories: [],
  mealLogs: [],
  mealPrepItems: [],
};

// Reducer関数
function expenseReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: action.payload,
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
      };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id ? action.payload : expense
        ),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload),
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? action.payload : category
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };
    case 'SET_MEAL_LOGS':
      return {
        ...state,
        mealLogs: action.payload,
      };
    case 'ADD_MEAL_LOG':
      return {
        ...state,
        mealLogs: [...state.mealLogs, action.payload],
      };
    case 'UPDATE_MEAL_LOG':
      return {
        ...state,
        mealLogs: state.mealLogs.map(mealLog =>
          mealLog.id === action.payload.id ? action.payload : mealLog
        ),
      };
    case 'DELETE_MEAL_LOG':
      return {
        ...state,
        mealLogs: state.mealLogs.filter(mealLog => mealLog.id !== action.payload),
      };
    case 'SET_MEAL_PREP_ITEMS':
      return {
        ...state,
        mealPrepItems: action.payload,
      };
    case 'ADD_MEAL_PREP_ITEM':
      return {
        ...state,
        mealPrepItems: [...state.mealPrepItems, action.payload],
      };
    case 'UPDATE_MEAL_PREP_ITEM':
      return {
        ...state,
        mealPrepItems: state.mealPrepItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE_MEAL_PREP_ITEM':
      return {
        ...state,
        mealPrepItems: state.mealPrepItems.filter(item => item.id !== action.payload),
      };
    default:
      return state;
  }
}

// Context型定義
interface ExpenseContextType {
  state: AppState;
  user: User | null;
  loading: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addMealLog: (mealLog: Omit<MealLog, 'id'>) => Promise<void>;
  updateMealLog: (mealLog: MealLog) => Promise<void>;
  deleteMealLog: (id: string) => Promise<void>;
  addMealPrepItem: (mealPrepItem: Omit<MealPrepItem, 'id'>) => Promise<void>;
  updateMealPrepItem: (mealPrepItem: MealPrepItem) => Promise<void>;
  deleteMealPrepItem: (id: string) => Promise<void>;
}

// Context作成
const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// Provider実装
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        // ログイン時にデフォルトカテゴリを初期化
        try {
          await categoryService.initializeDefaultCategories(user.uid);
        } catch (error) {
          console.error('デフォルトカテゴリ初期化エラー:', error);
        }
      } else {
        // ログアウト時にstateをクリア
        dispatch({ type: 'SET_EXPENSES', payload: [] });
        dispatch({ type: 'SET_CATEGORIES', payload: [] });
        dispatch({ type: 'SET_MEAL_LOGS', payload: [] });
        dispatch({ type: 'SET_MEAL_PREP_ITEMS', payload: [] });
      }
    });

    return () => unsubscribe();
  }, []);

  // ユーザーが変わったときにFirestoreからデータを取得
  useEffect(() => {
    if (!user) return;

    let unsubscribeExpenses: (() => void) | undefined;
    let unsubscribeCategories: (() => void) | undefined;
    let unsubscribeMealLogs: (() => void) | undefined;
    let unsubscribeMealPrepItems: (() => void) | undefined;

    try {
      // 支出をリアルタイム監視
      unsubscribeExpenses = expenseService.subscribeToExpenses(user.uid, (expenses) => {
        dispatch({ type: 'SET_EXPENSES', payload: expenses });
      });

      // カテゴリをリアルタイム監視
      unsubscribeCategories = categoryService.subscribeToCategories(user.uid, (categories) => {
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
      });

      // 食事ログをリアルタイム監視
      unsubscribeMealLogs = mealLogService.subscribeToMealLogs(user.uid, (mealLogs) => {
        dispatch({ type: 'SET_MEAL_LOGS', payload: mealLogs });
      });

      // 作り置きをリアルタイム監視
      unsubscribeMealPrepItems = mealPrepService.subscribeToMealPrepItems(user.uid, (mealPrepItems) => {
        dispatch({ type: 'SET_MEAL_PREP_ITEMS', payload: mealPrepItems });
      });
    } catch (error) {
      console.error('データ監視エラー:', error);
    }

    return () => {
      unsubscribeExpenses?.();
      unsubscribeCategories?.();
      unsubscribeMealLogs?.();
      unsubscribeMealPrepItems?.();
    };
  }, [user]);

  // 支出操作
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await expenseService.addExpense(user.uid, expense);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('支出追加エラー:', error);
      throw error;
    }
  };

  const updateExpense = async (expense: Expense) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await expenseService.updateExpense(user.uid, expense.id, expense);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('支出更新エラー:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await expenseService.deleteExpense(user.uid, id);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('支出削除エラー:', error);
      throw error;
    }
  };

  // カテゴリ操作
  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await categoryService.addCategory(user.uid, category);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await categoryService.updateCategory(user.uid, category.id, category);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('カテゴリ更新エラー:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await categoryService.deleteCategory(user.uid, id);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('カテゴリ削除エラー:', error);
      throw error;
    }
  };

  // 食事ログ操作
  const addMealLog = async (mealLog: Omit<MealLog, 'id'>) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await mealLogService.addMealLog(user.uid, mealLog);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('食事ログ追加エラー:', error);
      throw error;
    }
  };

  const updateMealLog = async (mealLog: MealLog) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await mealLogService.updateMealLog(user.uid, mealLog.id, mealLog);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('食事ログ更新エラー:', error);
      throw error;
    }
  };

  const deleteMealLog = async (id: string) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await mealLogService.deleteMealLog(user.uid, id);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('食事ログ削除エラー:', error);
      throw error;
    }
  };

  // 作り置き操作（Firestore実装）
  const addMealPrepItem = async (mealPrepItem: Omit<MealPrepItem, 'id'>) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await mealPrepService.addMealPrepItem(user.uid, mealPrepItem);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('作り置き追加エラー:', error);
      throw error;
    }
  };

  const updateMealPrepItem = async (mealPrepItem: MealPrepItem) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      await mealPrepService.updateMealPrepItem(user.uid, mealPrepItem.id, mealPrepItem);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('作り置き更新エラー:', error);
      throw error;
    }
  };

  const deleteMealPrepItem = async (id: string) => {
    if (!user) throw new Error('ユーザーがログインしていません');
    try {
      // 作り置きアイテムを取得
      const mealPrepItem = state.mealPrepItems.find(item => item.id === id);
      
      if (mealPrepItem) {
        // 作り置きに使用された食材の消費率を戻す
        // 保存された食材の消費率情報を使って復元
        const ingredientConsumption = mealPrepItem.ingredientConsumption || {};
        
        // 各食材の消費率を更新
        for (const ingredientId of mealPrepItem.ingredients) {
          const expense = state.expenses.find(e => e.id === ingredientId);
          let consumptionToRestore = ingredientConsumption[ingredientId] || 0;
          
          // 既存データでingredientConsumptionがない場合のフォールバック
          if (consumptionToRestore === 0 && Object.keys(ingredientConsumption).length === 0) {
            // 作り置きの消費率に応じて、食材の消費率を比例的に戻す（簡易的な処理）
            const mealPrepConsumptionRate = mealPrepItem.consumptionRate;
            if (expense && expense.consumptionRate !== undefined) {
              consumptionToRestore = Math.min(expense.consumptionRate, mealPrepConsumptionRate);
            }
          }
          
          if (expense && expense.consumptionRate !== undefined) {
            const newConsumptionRate = Math.max(0, expense.consumptionRate - consumptionToRestore);
            
            console.log(`食材 ${expense.description}: ${expense.consumptionRate}% → ${newConsumptionRate}% (戻し量: ${consumptionToRestore}%)`);
            
            await updateExpense({
              ...expense,
              consumptionRate: newConsumptionRate
            });
          }
        }
      }
      
      await mealPrepService.deleteMealPrepItem(user.uid, id);
      // リアルタイム監視により自動的にstateが更新される
    } catch (error) {
      console.error('作り置き削除エラー:', error);
      throw error;
    }
  };

  const value: ExpenseContextType = {
    state,
    user,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    addMealLog,
    updateMealLog,
    deleteMealLog,
    addMealPrepItem,
    updateMealPrepItem,
    deleteMealPrepItem,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

// Custom Hook
export function useExpense() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
} 