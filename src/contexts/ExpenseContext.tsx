import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { AppState, AppAction, Expense, Category } from '../types';
import { auth } from '../lib/firebase';
import { expenseService, categoryService } from '../lib/firestore';

// 初期状態
const initialState: AppState = {
  expenses: [],
  categories: [],
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
      }
    });

    return () => unsubscribe();
  }, []);

  // ユーザーが変わったときにFirestoreからデータを取得
  useEffect(() => {
    if (!user) return;

    let unsubscribeExpenses: (() => void) | undefined;
    let unsubscribeCategories: (() => void) | undefined;

    try {
      // 支出をリアルタイム監視
      unsubscribeExpenses = expenseService.subscribeToExpenses(user.uid, (expenses) => {
        dispatch({ type: 'SET_EXPENSES', payload: expenses });
      });

      // カテゴリをリアルタイム監視
      unsubscribeCategories = categoryService.subscribeToCategories(user.uid, (categories) => {
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
      });
    } catch (error) {
      console.error('データ監視エラー:', error);
    }

    return () => {
      unsubscribeExpenses?.();
      unsubscribeCategories?.();
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