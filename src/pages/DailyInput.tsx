import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import './DailyInput.css';

const DailyInput: React.FC = () => {
  const navigate = useNavigate();
  const { addExpense } = useExpense();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10), // 今日の日付をデフォルト
    amount: '',
    description: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description.trim()) {
      alert('金額と支出内容は必須です');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('正しい金額を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      await addExpense({
        date: formData.date,
        amount: amount,
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
      });

      // 成功メッセージを表示
      setShowSuccess(true);
      
      // フォームをリセット
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        description: '',
      });

      // 2秒後に成功メッセージを非表示
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error adding expense:', error);
      alert('支出の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [100, 300, 500, 1000, 2000, 3000];
  const quickDescriptions = [
    '昼食', '夕食', 'コーヒー', '電車代', 'バス代', 
    'コンビニ', 'スーパー', 'ガソリン', '駐車場', '本・雑誌'
  ];

  return (
    <div className="daily-input">
      <div className="daily-input-container">
        <header className="daily-input-header">
          <h1>支出入力</h1>
          <p>効率的な家計管理のための支出記録</p>
        </header>

        {showSuccess && (
          <div className="success-message">
            ◆ 支出が正常に記録されました
          </div>
        )}

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label htmlFor="date">日付</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">金額 (円)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="1000"
              min="1"
              step="1"
              required
              className="form-input"
            />
            <div className="quick-amounts">
              <span className="quick-label">クイック入力:</span>
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="quick-button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
                >
                  ¥{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">支出内容</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="支出の詳細を入力してください"
              required
              className="form-textarea"
              rows={3}
            />
            <div className="quick-descriptions">
              <span className="quick-label">よく使う項目:</span>
              <div className="quick-tags">
                {quickDescriptions.map((desc) => (
                  <button
                    key={desc}
                    type="button"
                    className="quick-tag"
                    onClick={() => setFormData(prev => ({ ...prev, description: desc }))}
                  >
                    {desc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cancel-button"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !formData.amount || !formData.description.trim()}
            >
              {isSubmitting ? '記録中...' : '支出を記録'}
            </button>
          </div>
        </form>

        <div className="form-tips">
          <h3>◆ 操作ガイド</h3>
          <ul>
            <li>金額のクイック入力ボタンで効率的に入力できます</li>
            <li>よく使う項目タグをクリックして内容を自動入力</li>
            <li>記録後は週次画面でカテゴリーを設定できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyInput; 