# 家計簿管理システム

React + TypeScript で構築された高機能家計簿管理アプリケーションです。

## 主要機能

### 日次支出入力画面
- 日付、金額、支出内容の入力
- クイック金額入力ボタン
- よく使う項目のタグ機能
- 入力成功時の視覚的フィードバック

### 週次リスト画面  
- 支出のリスト表示（週別ナビゲーション）
- カテゴリー登録機能
- カテゴリー別集計表示
- 新しいカテゴリーの追加
- 支出の削除機能

### 月次集計画面
- カテゴライズされた支出の集計結果
- カテゴリー別内訳（パーセンテージ、金額、件数）
- 日別支出推移グラフ
- 前月比較機能
- 支出分析とアドバイス

### ホーム画面
- ダッシュボード機能
- 今日・今週・今月の支出サマリー
- 最近の支出履歴
- 各画面へのクイックアクセス

## 技術スタック

- **Frontend**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Styling**: CSS Modules

## セットアップ

### 前提条件
- Node.js (推奨: v18以上)
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/household-account-book.git
cd household-account-book

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プレビュー
npm run preview

# Lint実行
npm run lint
```

## データ保存

アプリケーションはFirestoreを使用してデータを安全に保存します。
データは以下のコレクションで管理されます：

- `expenses`: 支出データ
- `categories`: カテゴリーデータ
