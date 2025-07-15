import React from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import './Auth.css';

interface AuthProps {
  user: User | null;
  loading: boolean;
}

const Auth: React.FC<AuthProps> = ({ user, loading }) => {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('ログインエラー:', error);
      alert('ログインに失敗しました。もう一度お試しください。');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-loading">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>家計簿管理</h1>
          <p>Googleアカウントでログインして、どの端末からでもアクセスできる家計簿を始めましょう。</p>
          <button onClick={handleSignIn} className="auth-button">
            <span className="google-icon">🔑</span>
            Googleでログイン
          </button>
          <div className="auth-benefits">
            <div className="benefit-item">
              ✅ 複数端末でデータ同期
            </div>
            <div className="benefit-item">
              ✅ データの自動バックアップ
            </div>
            <div className="benefit-item">
              ✅ 安全なクラウド保存
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-info">
      <div className="user-profile">
        <img src={user.photoURL || ''} alt="プロフィール" className="user-avatar" />
        <span className="user-name">{user.displayName}</span>
      </div>
      <button onClick={handleSignOut} className="logout-button">
        ログアウト
      </button>
    </div>
  );
};

export default Auth; 