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
    } catch (error: any) {
      console.error('ログインエラー:', error);
      console.error('エラーコード:', error.code);
      console.error('エラーメッセージ:', error.message);
      
      let errorMessage = 'ログインに失敗しました。';
      
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'ポップアップがブロックされました。ポップアップを許可してください。';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'ログインがキャンセルされました。';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'このドメインは認証が許可されていません。Firebase設定を確認してください。';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google認証が有効になっていません。Firebase設定を確認してください。';
          break;
        default:
          errorMessage = `ログインエラー: ${error.message}`;
      }
      
      alert(errorMessage);
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
          <h1>家計簿管理システム</h1>
          <p>セキュアなGoogleアカウント連携により、どのデバイスからでも安全にアクセスできる家計簿システムをご利用いただけます。</p>
          <button onClick={handleSignIn} className="auth-button">
            <span className="google-icon">⋄</span>
            Googleアカウントでログイン
          </button>
          <div className="auth-benefits">
            <div className="benefit-item">
              ◆ マルチデバイス対応データ同期
            </div>
            <div className="benefit-item">
              ◆ 自動バックアップシステム
            </div>
            <div className="benefit-item">
              ◆ エンタープライズグレードセキュリティ
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