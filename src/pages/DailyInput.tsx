import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../contexts/ExpenseContext';
import './DailyInput.css';

type TaxType = '8% VAT' | '10% VAT' | 'Tax Included';
type RoundingType = 'Round Down' | 'Round Up';

interface ExpenseItem {
  id: string;
  amount: string;
  description: string;
  taxType: TaxType;
}

const DailyInput: React.FC = () => {
  const navigate = useNavigate();
  const { addExpense } = useExpense();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    storeName: '',
  });
  
  const [roundingType, setRoundingType] = useState<RoundingType>('Round Down');
  const [items, setItems] = useState<ExpenseItem[]>([
    { id: '1', amount: '', description: '', taxType: '10% VAT' }
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

  const handleItemChange = (id: string, field: keyof ExpenseItem, value: string) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      );
      
      // 最後の行が入力されていて、かつその行が最後の行の場合、新しい行を追加
      const lastItem = newItems[newItems.length - 1];
      if (lastItem.id === id && (lastItem.amount || lastItem.description)) {
        const newId = (parseInt(lastItem.id) + 1).toString();
        newItems.push({ id: newId, amount: '', description: '', taxType: '10% VAT' });
      }
      
      return newItems;
    });
  };

  const removeItem = (id: string) => {
    setItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      // 最低1行は残す
      if (newItems.length === 0) {
        return [{ id: '1', amount: '', description: '', taxType: '10% VAT' }];
      }
      return newItems;
    });
  };

  const addItem = () => {
    const newId = (Math.max(...items.map(item => parseInt(item.id))) + 1).toString();
    setItems(prev => [...prev, { id: newId, amount: '', description: '', taxType: '10% VAT' }]);
  };

  // 端数処理を考慮した税込金額計算
  const calculateTaxIncludedAmount = (amount: number, taxType: TaxType): number => {
    let taxed = amount;
    switch (taxType) {
      case '8% VAT':
        taxed = amount * 1.08;
        break;
      case '10% VAT':
        taxed = amount * 1.1;
        break;
      case 'Tax Included':
        taxed = amount;
        break;
      default:
        taxed = amount;
    }
    if (taxType === 'Tax Included') return taxed;
    if (roundingType === 'Round Down') {
      return Math.floor(taxed);
    } else if (roundingType === 'Round Up') {
      return Math.ceil(taxed);
    }
    return taxed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.storeName.trim()) {
      alert('Store name is required');
      return;
    }

    const validItems = items.filter(item => 
      item.amount.trim() && item.description.trim()
    );

    if (validItems.length === 0) {
      alert('Please enter at least one item');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const item of validItems) {
        const baseAmount = parseFloat(item.amount.replace(/,/g, ''));
        
        if (isNaN(baseAmount) || baseAmount <= 0) {
          alert(`Amount for "${item.description}" is invalid`);
          setIsSubmitting(false);
          return;
        }

        // 税込金額を計算
        const taxIncludedAmount = calculateTaxIncludedAmount(baseAmount, item.taxType);

        const expenseData: any = {
          date: formData.date,
          amount: taxIncludedAmount,
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
      setItems([{ id: '1', amount: '', description: '', taxType: '10% VAT' }]);

      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error adding expenses:', error);
      alert('Failed to register expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => {
      if (!item.amount.trim()) return total;
      const baseAmount = parseFloat(item.amount.replace(/,/g, ''));
      if (isNaN(baseAmount)) return total;
      return total + calculateTaxIncludedAmount(baseAmount, item.taxType);
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
          <h1>Expense Input</h1>
          <p>Efficiently input multiple items</p>
        </header>

        {showSuccess && (
          <div className="success-message">
            ◆ {getValidRowCount()} expenses have been successfully recorded
          </div>
        )}

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-header">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="form-input"
                lang="en"
              />
            </div>

            <div className="form-group">
              <label htmlFor="storeName">Store Name</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Enter store name"
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="spreadsheet-section">
            <div className="section-header">
              <h3>Item List</h3>
              <div className="spreadsheet-actions">
                <button
                  type="button"
                  onClick={addItem}
                  className="add-row-button"
                >
                  Add Row
                </button>
              </div>
            </div>

            <div className="spreadsheet-container">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th className="row-header">#</th>
                    <th className="amount-header">Amount (¥)</th>
                    <th className="tax-type-header">Tax Type</th>
                    <th className="description-header">Description</th>
                    <th className="action-header">Action</th>
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
                          placeholder="Enter amount"
                          className="cell-input"
                        />
                      </td>
                      <td className="tax-type-cell">
                        <select
                          value={item.taxType}
                          onChange={(e) => handleItemChange(item.id, 'taxType', e.target.value as TaxType)}
                          className="tax-type-select"
                        >
                          <option value="8% VAT">8% VAT</option>
                          <option value="10% VAT">10% VAT</option>
                          <option value="Tax Included">Tax Included</option>
                        </select>
                      </td>
                      <td className="description-cell">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Enter description"
                          className="cell-input"
                        />
                      </td>
                      <td className="action-cell">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="remove-row-button"
                            title="Remove this row"
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
              <div className="total-amount-with-rounding">
                <div className="total-amount">
                  Total: <span className="total-value">¥{getTotalAmount().toLocaleString('en-US')}</span>
                  <span className="total-count">
                    ({getValidRowCount()} items)
                  </span>
                </div>
                <div className="rounding-type-group">
                  <label htmlFor="roundingType" className="rounding-type-label">
                    Rounding
                  </label>
                  <select
                    id="roundingType"
                    value={roundingType}
                    onChange={e => setRoundingType(e.target.value as RoundingType)}
                    className="rounding-type-select"
                  >
                    <option value="Round Down">Round Down</option>
                    <option value="Round Up">Round Up</option>
                  </select>
                </div>
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
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !formData.storeName.trim() || getValidRowCount() === 0}
            >
              {isSubmitting ? 'Recording...' : `Register ${getValidRowCount()} items`}
            </button>
          </div>
        </form>

        <div className="form-tips">
          <h3>◆ Operation Guide</h3>
          <ul>
            <li><strong>Tab/Enter</strong>: Move to next field</li>
            <li><strong>Add Row Button</strong>: Add a new item row</li>
            <li><strong>× Button</strong>: Remove the row</li>
            <li><strong>Auto Add</strong>: A new row is automatically added when you enter data in the last row</li>
            <li><strong>Number Format</strong>: Amount field is automatically formatted with commas when focus is lost</li>
            <li><strong>Tax Type Selection</strong>: Select tax type for each item (8% VAT, 10% VAT, Tax Included)</li>
            <li><strong>Rounding Selection</strong>: Choose rounding method (Round Down / Round Up) for total calculation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DailyInput; 