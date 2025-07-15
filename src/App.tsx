import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExpenseProvider } from './contexts/ExpenseContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import DailyInput from './pages/DailyInput';
import WeeklyList from './pages/WeeklyList';
import MonthlySummaryPage from './pages/MonthlySummary';
import './App.css';

function App() {
  return (
    <ExpenseProvider>
      <Router>
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/daily" element={<DailyInput />} />
              <Route path="/weekly" element={<WeeklyList />} />
              <Route path="/monthly" element={<MonthlySummaryPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ExpenseProvider>
  );
}

export default App;
