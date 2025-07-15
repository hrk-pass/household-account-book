import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction, Expense, Category } from '../types';

// 初期状態
const initialState: AppState = {
  expenses: [],
  categories: [
    { id: '1', name: '食費', color: '#FF6B6B' },
    { id: '2', name: '交通費', color: '#4ECDC4' },
    { id: '3', name: '娯楽', color: '#45B7D1' },
    { id: '4', name: '日用品', color: '#96CEB4' },
    { id: '5', name: 'その他', color: '#FCEA2B' },
  ],
};

// Reducer関数
function expenseReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
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
    default:
      return state;
  }
}

// コンテキストの型定義
interface ExpenseContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

// コンテキストの作成
const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  // localStorage からデータを読み込み
  useEffect(() => {
    const savedExpenses = localStorage.getItem('household-expenses');
    const savedCategories = localStorage.getItem('household-categories');

    if (savedExpenses) {
      try {
        const expenses = JSON.parse(savedExpenses);
        dispatch({ type: 'SET_EXPENSES', payload: expenses });
      } catch (error) {
        console.error('Failed to load expenses from localStorage:', error);
      }
    }

    if (savedCategories) {
      try {
        const categories = JSON.parse(savedCategories);
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
      } catch (error) {
        console.error('Failed to load categories from localStorage:', error);
      }
    }
  }, []);

  // 状態変更時にlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('household-expenses', JSON.stringify(state.expenses));
  }, [state.expenses]);

  useEffect(() => {
    localStorage.setItem('household-categories', JSON.stringify(state.categories));
  }, [state.categories]);

  // ヘルパー関数
  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
  };

  const updateExpense = (expense: Expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
  };

  const deleteExpense = (id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
  };

  const updateCategory = (category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
  };

  const deleteCategory = (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  const value: ExpenseContextType = {
    state,
    dispatch,
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

// カスタムフック
export function useExpense() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
} 