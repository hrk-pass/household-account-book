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
      
      let errorMessage = 'Login failed.';
      
      switch (error.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked. Please allow popups.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Login was cancelled.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'This domain is not authorized. Please check your Firebase settings.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google authentication is not enabled. Please check your Firebase settings.';
          break;
        default:
          errorMessage = `Login error: ${error.message}`;
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
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Household Ledger System</h1>
          <p>With secure Google account integration, you can safely access your household ledger system from any device.</p>
          <button onClick={handleSignIn} className="auth-button">
            <span className="google-icon">⧄</span>
            Sign in with Google
          </button>
          <div className="auth-benefits">
            <div className="benefit-item">
              ◆ Multi-device sync support
            </div>
            <div className="benefit-item">
              ◆ Automatic backup system
            </div>
            <div className="benefit-item">
              ◆ Enterprise-grade security
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
        Logout
      </button>
    </div>
  );
};

export default Auth; 