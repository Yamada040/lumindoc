# Lumindoc - AI-Powered Document Assistant

![Lumindoc Logo](https://via.placeholder.com/200x100/3B82F6/FFFFFF?text=Lumindoc)

**Lumindoc**は、AIの力であなたのドキュメント管理を革新する次世代のポートフォリオアプリケーションです。PDFやテキストファイルを瞬時に分析し、詳細な要約を生成します。

## ✨ 主な機能

- 📄 **ドキュメントアップロード**: PDFとテキストファイルに対応
- 🤖 **AI要約**: Google Gemini APIによる高精度な要約生成
- 💾 **クラウドストレージ**: Supabaseによるセキュアなファイル保存
- 📱 **レスポンシブデザイン**: あらゆるデバイスで最適な表示
- 🎨 **モダンUI**: Framer Motionによる滑らかなアニメーション
- 👁️ **PDFプレビュー**: ブラウザ内でのPDF表示

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **Framer Motion** - アニメーションライブラリ
- **Lucide React** - アイコンライブラリ

### バックエンド
- **Next.js API Routes** - サーバーレスAPI
- **Supabase** - BaaS（データベース・ストレージ）
- **Google Gemini API** - AI要約エンジン

### UI/UX
- **React PDF** - PDFレンダリング
- **React Dropzone** - ファイルアップロード
- **Radix UI** - アクセシブルなUIコンポーネント

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/lumindoc.git
cd lumindoc
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`を`.env.local`にコピーして、必要な値を設定してください。

```bash
cp .env.example .env.local
```

#### 必要な環境変数:

- `NEXT_PUBLIC_GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/app/apikey)で取得
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー

### 4. Supabaseの設定

1. [Supabase](https://supabase.com)でアカウント作成・プロジェクト作成
2. `database/schema.sql`の内容をSQL Editorで実行
3. Storageで`documents`バケットを作成
4. 環境変数を更新

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## 📁 プロジェクト構造

```
lumindoc/
├── app/                     # Next.js App Router
│   ├── api/                 # API Routes
│   ├── globals.css          # グローバルスタイル
│   └── page.tsx             # メインページ
├── components/              # Reactコンポーネント
│   ├── FileUpload.tsx       # ファイルアップロード
│   ├── DocumentDashboard.tsx # ドキュメント管理
│   ├── SummaryCard.tsx      # 要約表示
│   └── PDFViewer.tsx        # PDF閲覧
├── lib/                     # ユーティリティ
│   ├── gemini.ts           # Gemini API統合
│   ├── supabase.ts         # Supabase クライアント
│   └── utils.ts            # ヘルパー関数
├── types/                   # TypeScript型定義
└── database/               # データベーススキーマ
```

## 🎯 使い方

1. **ホーム画面**: アプリの概要と統計を表示
2. **アップロード**: PDFやテキストファイルをドラッグ&ドロップ
3. **AI処理**: Gemini APIが自動で詳細要約を生成
4. **ダッシュボード**: アップロードしたファイルを一覧管理
5. **要約表示**: セクション別の詳細な要約を確認
6. **PDFプレビュー**: ブラウザ内でPDFを表示・操作

## 🔧 主要なコンポーネント

### FileUpload
- ドラッグ&ドロップ対応のファイルアップロード
- プログレス表示とファイル制限
- リアルタイムフィードバック

### SummaryCard
- AI生成要約の詳細表示
- 折りたたみ可能なセクション
- 重要度別の視覚的な整理

### DocumentDashboard
- フィルタリング・ソート機能
- グリッド/リスト表示の切り替え
- 検索とアクション（削除・ダウンロード）

### PDFViewer
- ズーム・ページ移動機能
- モーダル表示対応
- フルスクリーンプレビュー

## 🔐 セキュリティ

- Row Level Security (RLS) でデータアクセス制御
- ファイルサイズ制限（10MB）
- 対応ファイル形式の制限
- APIキーの適切な管理

## 📱 レスポンシブ対応

- スマートフォン（320px〜）
- タブレット（768px〜）
- デスクトップ（1024px〜）
- 大画面（1440px〜）

## 🚀 デプロイ

### Vercel（推奨）

```bash
npm run build
npx vercel --prod
```

### その他のプラットフォーム

- Netlify
- AWS Amplify
- Google Cloud Platform

## 📈 パフォーマンス最適化

- Next.js 15の最新機能を活用
- 画像の自動最適化
- コード分割とLazy Loading
- アニメーションのGPU加速

## 🤝 コントリビューション

プルリクエストやイシューを歓迎します！

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [Google Gemini](https://ai.google.dev/) - AI要約エンジン
- [Supabase](https://supabase.com/) - バックエンドサービス
- [Vercel](https://vercel.com/) - ホスティングプラットフォーム
- [Next.js](https://nextjs.org/) - Reactフレームワーク

---

**Lumindoc** - AIの力で、あなたのドキュメント管理を革新します 🚀
