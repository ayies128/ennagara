# ennagaraツール

QiitaのトレンドRSSフィードから最新記事を取得し、整形されたテキストファイルをダウンロードできるNestJSアプリケーションです。

## 機能
- NestJSベースのWebアプリケーション
- Vercelでのデプロイ対応
- QiitaトレンドRSSフィードからの自動データ取得
- 整形されたテキストファイルのダウンロード機能
- URLクリーニング（UTMパラメータ除去）
- CORS対応
- タイムゾーン問題を回避した正確な日付ファイル名生成

## セットアップ

### プロジェクト構造
```
ennagara/
├── src/
│   ├── main.ts              # NestJSエントリーポイント
│   ├── app.module.ts        # アプリケーションモジュール
│   └── qiita/
│       ├── qiita.module.ts  # Qiitaモジュール
│       ├── qiita.service.ts # RSS取得・データ処理
│       └── qiita.controller.ts # エンドポイント定義
├── api/
│   └── index.ts             # Vercel用ハンドラー
├── package.json             # 依存関係定義
├── tsconfig.json            # TypeScript設定
├── nest-cli.json            # NestJS設定
└── vercel.json              # Vercel設定
```

### クイックスタート
1. **このリポジトリをクローン**
   ```bash
   git clone <repository-url>
   cd ennagara
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **ローカル開発サーバーを起動**
   ```bash
   npm run start:dev
   ```

4. **動作確認**
   - ブラウザで http://localhost:3000/qiita/trend にアクセス
   - txtファイルがダウンロードされることを確認

5. **Vercelにデプロイ**
   ```bash
   vercel --prod
   ```

## 使用方法

### 開発環境での実行
```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run start:dev

# ブラウザで以下にアクセス
http://localhost:3000/qiita/trend
```

### Vercelデプロイ
vercel.jsonが設定済みのため、そのままVercelにデプロイ可能です。

## 出力仕様
- **データソース**: https://qiita.com/popular-items/feed
- **取得件数**: 上位20件
- **出力形式**: テキストファイル (.txt)
- **ファイル名**: YYYYMMDD_Qiitaトレンド.txt（RSSのupdated日時を使用）

### 出力内容構成
1. **ヘッダーテキスト**
   ```
   本日のQiitaのトレンドをAIでまとめています。
   通勤時や退勤時などにながら聞きしてはいかがでしょうか？
   気になった記事は下記リンクから詳細へ！

   出典
   ```

2. **記事タイトルとURL一覧** (40行)
   - 各記事ごとに「タイトル」「URL」の2行形式
   - 20件分で合計40行

3. **区切り** (5行の空行)

4. **URLのみ一覧** (20行)
   - クリーンなURL（UTMパラメータ等を除去）

## エンドポイント
- `GET /qiita/trend` - Qiitaトレンドのテキストファイルをダウンロード

## 技術スタック
- NestJS
- TypeScript
- axios (HTTP通信)
- xml2js (RSS解析)
- Vercel (デプロイ)
  
