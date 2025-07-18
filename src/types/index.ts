// 支出データの型定義
export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD形式
  amount: number;
  description: string;
  category?: string;
  subCategory?: string; // サブカテゴリー（食事Log機能用）
  consumptionRate?: number; // 消費率（0-100、食材の場合）
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
  mealLogs: MealLog[];
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
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_MEAL_LOG'; payload: MealLog }
  | { type: 'UPDATE_MEAL_LOG'; payload: MealLog }
  | { type: 'DELETE_MEAL_LOG'; payload: string }
  | { type: 'SET_MEAL_LOGS'; payload: MealLog[] };

// 食事Log機能用の型定義
export type KitchenSubCategory = '食材' | '調味料' | '消耗品' | 'その他';

export type MealType = '朝食' | '昼食' | '夕食' | '間食';

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD形式
  mealType: MealType;
  ingredients: string[]; // 使用した食材のExpense ID
  notes?: string;
  createdAt: string;
}

export interface FoodItem extends Expense {
  subCategory: KitchenSubCategory;
  consumptionRate: number; // 0-100
  isConsumed: boolean; // 消費率が100%かどうか
} 