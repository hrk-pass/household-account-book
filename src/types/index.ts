// 支出データの型定義
export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD形式
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
}

// カテゴリーの型定義
export interface Category {
  id: string;
  name: string;
  color: string;
}

// 集計データの型定義
export interface MonthlySummary {
  month: string; // YYYY-MM形式
  totalAmount: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    count: number;
    color: string;
    percentage: number;
  }[];
}

// アプリの状態管理用の型定義
export interface AppState {
  expenses: Expense[];
  categories: Category[];
}

// アクションの型定義
export type AppAction =
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }; 