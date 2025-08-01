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

## クイックスタート

### 1. プロジェクトの作成から実装まで（一発構成）

```bash
# プロジェクトディレクトリ作成
mkdir ennagara && cd ennagara

# package.json作成
cat > package.json << 'EOF'
{
  "name": "ennagara",
  "version": "0.0.1",
  "description": "Qiita trend RSS feed downloader tool",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "axios": "^1.6.0",
    "xml2js": "^0.6.2",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/supertest": "^6.0.0",
    "@types/xml2js": "^0.4.11",
    "@vercel/node": "^3.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
EOF

# 設定ファイル群作成
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
EOF

cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
EOF

cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [{ "src": "api/index.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.ts" }]
}
EOF

# .gitignore作成
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Compiled output
/dist
/build
*.tsbuildinfo

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
/coverage
/.nyc_output

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace
.history/*

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Temporary files
*.tmp
*.temp
*.swp
*.swo
*~

# Test files
test_output.txt
test_modified.txt
*.test.txt

# Vercel
.vercel

# Next.js (if applicable)
.next/
out/

# Misc
*.tgz
EOF

# ディレクトリ構造作成
mkdir -p src/qiita api

# メインアプリケーションファイル作成
cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
EOF

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { QiitaModule } from './qiita/qiita.module';

@Module({
  imports: [QiitaModule],
})
export class AppModule {}
EOF

# Qiitaサービス作成
cat > src/qiita/qiita.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as xml2js from 'xml2js';

export interface QiitaItem {
  title: string;
  link: string;
  updated: string;
}

export interface QiitaFeedData {
  items: QiitaItem[];
  feedUpdated: string;
}

@Injectable()
export class QiitaService {
  private readonly rssUrl = 'https://qiita.com/popular-items/feed';

  async fetchTrendingData(): Promise<QiitaFeedData> {
    try {
      const response = await axios.get(this.rssUrl);
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      const items = (result.feed.entry || []).slice(0, 20).map((item: any) => ({
        title: item.title[0],
        link: this.cleanUrl(item.link[0].$.href),
        updated: item.updated[0]
      }));
      
      const feedUpdated = result.feed.updated[0];
      
      return { items, feedUpdated };
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }

  private cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (error) {
      return url;
    }
  }

  generateTxtContent(items: QiitaItem[]): string {
    const headerText = `本日のQiitaのトレンドをAIでまとめています。
通勤時や退勤時などにながら聞きしてはいかがでしょうか？
気になった記事は下記リンクから詳細へ！

出典`;
    
    const titleAndUrlList = items.map(item => `${item.title}\n${item.link}`).join('\n');
    const urlOnlyList = items.map(item => item.link).join('\n');
    
    return `${headerText}\n${titleAndUrlList}\n\n\n\n\n\n${urlOnlyList}`;
  }

  generateFileName(feedUpdated: string): string {
    if (!feedUpdated) {
      return 'Qiitaトレンド.txt';
    }
    
    // 方法1: ISO 8601形式の日付文字列から日付部分を直接抽出
    const dateMatch = feedUpdated.match(/^(\d{4})-(\d{2})-(\d{2})/);
    
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      return `${year}${month}${day}_Qiitaトレンド.txt`;
    }
    
    // 方法2: substring で日付部分を直接切り出し
    if (feedUpdated.length >= 10 && feedUpdated.charAt(4) === '-' && feedUpdated.charAt(7) === '-') {
      const datePart = feedUpdated.substring(0, 10);
      return `${datePart.replace(/-/g, '')}_Qiitaトレンド.txt`;
    }
    
    // フォールバック: JSTタイムゾーンを考慮してDateオブジェクトを使用
    const updated = new Date(feedUpdated);
    const jstTime = new Date(updated.getTime() + (9 * 60 * 60 * 1000));
    
    const year = jstTime.getUTCFullYear();
    const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jstTime.getUTCDate()).padStart(2, '0');
    
    return `${year}${month}${day}_Qiitaトレンド.txt`;
  }
}
EOF

# Qiitaコントローラー作成
cat > src/qiita/qiita.controller.ts << 'EOF'
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { QiitaService } from './qiita.service';

@Controller('qiita')
export class QiitaController {
  constructor(private readonly qiitaService: QiitaService) {}

  @Get('trend')
  async downloadTrend(@Res() res: Response) {
    try {
      const { items, feedUpdated } = await this.qiitaService.fetchTrendingData();
      const content = this.qiitaService.generateTxtContent(items);
      const fileName = this.qiitaService.generateFileName(feedUpdated);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
EOF

# Qiitaモジュール作成
cat > src/qiita/qiita.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { QiitaController } from './qiita.controller';
import { QiitaService } from './qiita.service';

@Module({
  controllers: [QiitaController],
  providers: [QiitaService],
})
export class QiitaModule {}
EOF

# Vercelハンドラー作成
cat > api/index.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function createNestServer() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await app.init();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await createNestServer();
    return server.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
EOF

# 依存関係インストール
npm install

echo "✅ ennagaraツールのセットアップが完了しました！"
echo ""
echo "🚀 次のステップ:"
echo "1. npm run start:dev でローカル開発サーバーを起動"
echo "2. http://localhost:3000/qiita/trend でテスト"
echo "3. Vercelにデプロイ: vercel --prod"
```

### 2. 既存プロジェクトへの追加
既存のNestJSプロジェクトに追加する場合は、上記の`src/qiita/`と`api/`ディレクトリの内容をコピーし、`AppModule`に`QiitaModule`をインポートしてください。

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
  
