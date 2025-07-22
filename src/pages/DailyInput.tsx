import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import './DailyInput.css';

interface ExpenseItem {
  id: string;
  amount: string;
  description: string;
}

const DailyInput: React.FC = () => {
  const navigate = useNavigate();
  const { state, addExpense } = useExpense();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    storeName: '',
  });
  
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: '1', amount: '', description: '' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (id: string, field: 'amount' | 'description', value: string) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      );
      
      // 最後の行が入力されていて、かつその行が最後の行の場合、新しい行を追加
      const lastItem = newItems[newItems.length - 1];
      if (lastItem.id === id && (lastItem.amount || lastItem.description)) {
        const newId = (parseInt(lastItem.id) + 1).toString();
        newItems.push({ id: newId, amount: '', description: '' });
      }
      
      return newItems;
    });
  };

  const removeItem = (id: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      // 最低1行は残す
      if (newItems.length === 0) {
        return [{ id: '1', amount: '', description: '' }];
      }
      return newItems;
    });
  };

  const addItem = () => {
    const newId = (Math.max(...items.map(item => parseInt(item.id))) + 1).toString();
    setItems(prev => [...prev, { id: newId, amount: '', description: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.storeName.trim()) {
      alert('店舗名は必須です');
      return;
    }

    const validItems = items.filter(item => 
      item.amount.trim() && item.description.trim()
    );

    if (validItems.length === 0) {
      alert('少なくとも1つの明細を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const item of validItems) {
        const amount = parseFloat(item.amount.replace(/,/g, ''));
        
        if (isNaN(amount) || amount <= 0) {
          alert(`明細「${item.description}」の金額が正しくありません`);
          setIsSubmitting(false);
          return;
        }

        const expenseData: any = {
          date: formData.date,
          amount: amount,
          description: item.description.trim(),
          storeName: formData.storeName.trim(),
          createdAt: new Date().toISOString(),
        };

        await addExpense(expenseData);
      }

      setShowSuccess(true);
      
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        storeName: '',
      });

      // 明細をクリア
      setItems([{ id: '1', amount: '', description: '' }]);

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error adding expenses:', error);
      alert('支出の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => {
      if (!item.amount.trim()) return total;
      const amount = parseFloat(item.amount.replace(/,/g, ''));
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const getValidRowCount = () => {
    return items.filter(item => 
      item.amount.trim() && item.description.trim()
    ).length;
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? value : num.toLocaleString('ja-JP');
  };

  return (
    <div className="daily-input">
      <div className="daily-input-container">
        <header className="daily-input-header">
          <h1>支出入力</h1>
          <p>効率的に複数明細を入力</p>
        </header>

        {showSuccess && (
          <div className="success-message">
            ◆ {getValidRowCount()}件の支出が正常に記録されました
          </div>
        )}

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-header">
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
              <label htmlFor="storeName">店舗名</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="店舗名を入力してください"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="spreadsheet-section">
            <div className="section-header">
              <h3>明細一覧</h3>
              <div className="spreadsheet-actions">
                <button
                  type="button"
                  onClick={addItem}
                  className="add-row-button"
                >
                  行を追加
                </button>
              </div>
            </div>

            <div className="spreadsheet-container">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th className="row-header">#</th>
                    <th className="amount-header">金額 (円)</th>
                    <th className="description-header">支出内容</th>
                    <th className="action-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="expense-row">
                      <td className="row-number">{index + 1}</td>
                      <td className="amount-cell">
                        <input
                          type="text"
                          value={item.amount}
                          onChange={(e) => {
                            let value = e.target.value;
                            // 数字、コンマ、ピリオドのみ許可
                            value = value.replace(/[^\d,.-]/g, '');
                            handleItemChange(item.id, 'amount', value);
                          }}
                          onBlur={(e) => {
                            // フォーカスを失った時に数値フォーマット
                            const formatted = formatNumber(e.target.value);
                            handleItemChange(item.id, 'amount', formatted);
                          }}
                          placeholder="金額を入力"
                          className="cell-input"
                        />
                      </td>
                      <td className="description-cell">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="支出内容を入力"
                          className="cell-input"
                        />
                      </td>
                      <td className="action-cell">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="remove-row-button"
                            title="この行を削除"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="total-section">
              <div className="total-amount">
                合計金額: <span className="total-value">¥{getTotalAmount().toLocaleString()}</span>
                <span className="total-count">
                  ({getValidRowCount()}件)
                </span>
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
              disabled={isSubmitting || !formData.storeName.trim() || getValidRowCount() === 0}
            >
              {isSubmitting ? '記録中...' : `${getValidRowCount()}件を一括記録`}
            </button>
          </div>
        </form>

        <div className="form-tips">
          <h3>◆ 操作ガイド</h3>
          <ul>
            <li><strong>Tab/Enter</strong>: 次のフィールドに移動</li>
            <li><strong>行を追加ボタン</strong>: 新しい明細行を追加</li>
            <li><strong>×ボタン</strong>: 該当行を削除</li>
            <li><strong>自動追加</strong>: 最後の行に入力すると自動的に新しい行が追加されます</li>
            <li><strong>数値フォーマット</strong>: 金額欄はフォーカスを外すと自動的にカンマ区切りになります</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyInput; 