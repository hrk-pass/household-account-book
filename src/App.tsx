import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExpenseProvider, useExpense } from './contexts/ExpenseContext';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import Home from './pages/Home';
import DailyInput from './pages/DailyInput';
import WeeklyList from './pages/WeeklyList';
import MonthlySummaryPage from './pages/MonthlySummary';
import MealLog from './pages/MealLog';
import MealLogInput from './pages/MealLogInput';
import MealHistory from './pages/MealHistory';
import './App.css';

// 認証が必要なページをラップするコンポーネント
function AuthenticatedApp() {
  const { user, loading } = useExpense();

  // 認証チェック中またはログインしていない場合は認証画面を表示
  if (loading || !user) {
    return <Auth user={user} loading={loading} />;
  }

  // ログイン済みの場合はメインアプリを表示
  return (
    <div className="app">
      <Router>
        <div className="app-header">
          <Navigation />
          <Auth user={user} loading={loading} />
        </div>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/input" element={<DailyInput />} />
            <Route path="/list" element={<WeeklyList />} />
            <Route path="/summary" element={<MonthlySummaryPage />} />
            <Route path="/meal-log" element={<MealLog />} />
            <Route path="/meal-log-input" element={<MealLogInput />} />
            <Route path="/meal-history" element={<MealHistory />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

function App() {
  return (
    <ExpenseProvider>
      <AuthenticatedApp />
    </ExpenseProvider>
  );
}

export default App;
