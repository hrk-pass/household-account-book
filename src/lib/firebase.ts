import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCjt-fHJX26mEyaQ518hyaFPWLBAm14iTA",
  authDomain: "household-account-book-17f5a.firebaseapp.com",
  projectId: "household-account-book-17f5a",
  storageBucket: "household-account-book-17f5a.firebasestorage.app",
  messagingSenderId: "44518027909",
  appId: "1:44518027909:web:58116a41a991d48d626fec"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestore（データベース）
export const db = getFirestore(app);

// Authentication（認証）
export const auth = getAuth(app);

// Google認証プロバイダー
export const googleProvider = new GoogleAuthProvider();

export default app; 