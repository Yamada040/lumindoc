# Lumindoc

PDF/TXT をアップロードして、Gemini で要約する Next.js アプリです。  
保存はブラウザの `localStorage + Blob URL` で完結します。

## Features

- PDF / TXT アップロード（最大 10MB）
- Gemini による構造化要約（概要・重要点・セクション・難易度）
- ドキュメント一覧（検索 / フィルタ / ソート / 削除）
- 要約のテキストエクスポート
- API クォータ超過時の UI 通知（429 をトースト表示）

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Framer Motion
- Google Gemini API (`@google/generative-ai`)

## Project Structure

```txt
app/
  api/summarize/route.ts   # 要約 API（PDF/TXT テキスト抽出 + Gemini 呼び出し）
  page.tsx                 # 画面とユースケース制御
components/                # UI コンポーネント群
lib/
  gemini.ts                # Gemini 呼び出し、モデルフォールバック、quota 例外
  storage.ts               # ローカル保存サービス
  summaryExport.ts         # 要約のテキスト出力
types/                     # 型定義
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment Variables

`.env.local` を作成して API キーを設定します。

```bash
cp .env.example .env.local
```

必須:

- `GEMINI_API_KEY` または `NEXT_PUBLIC_GEMINI_API_KEY`

### 3. Run

```bash
npm run dev
```

## API

### `POST /api/summarize`

`multipart/form-data` で `file` を送信します。

- 対応: `application/pdf`, `text/plain`
- 上限: 10MB

レスポンス:

- `200`: `{ success: true, summary, originalContent }`
- `400`: 入力不正 / 抽出失敗
- `429`: Gemini クォータ超過（`Retry-After` を返す場合あり）
- `500`: サーバーエラー

## Storage Behavior

- 一覧メタ情報は `localStorage` に保存
- 元ファイルは `Blob URL` で一時保持
- 要約が `completed` または `error` になると Blob URL を解放
- そのため、要約完了後は元ファイルの再ダウンロードは不可

## Known Limitations

- PDF 抽出はテキストベース PDF 前提（画像PDF/OCR非対応）
- Gemini の利用上限に依存（無料枠では 429 が発生しうる）
- 現在 `package.json` に `lint` / `type-check` script は未定義

## Notes for Portfolio Review

- 失敗系（quota / 不正ファイル / 空ファイル）を UI/HTTP 両面でハンドリング
- モデル名差異に備えた Gemini フォールバックを実装

## License

MIT
