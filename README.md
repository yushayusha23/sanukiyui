# 人材BPO向け社内管理システム

求職者管理・案件管理・面談管理・連絡管理・進捗管理・案件マッチングを一元管理する社内システムです。

## 🚀 セットアップ手順

### 前提条件

- Node.js 18以上がインストールされていること
  - インストール方法: https://nodejs.org/ja/ または `brew install node`

### 1. Node.js のインストール（未インストールの場合）

```bash
# Homebrew を使う場合
brew install node

# または nvm を使う場合
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. プロジェクトのセットアップ

```bash
# このディレクトリに移動
cd /Users/yui/hr-bpo-system

# 依存パッケージのインストール + DBセットアップ + 初期データ投入
npm run setup
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 4. ログイン

| ユーザー | メールアドレス | パスワード |
|---------|-------------|----------|
| 管理者 | admin@example.com | admin1234 |
| スタッフ | staff@example.com | staff1234 |

---

## 📋 利用可能なコマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run db:push      # DBスキーマを適用
npm run db:seed      # 初期データ投入（再実行可）
npm run db:studio    # Prisma Studio (DB GUI) を起動
npm run setup        # 初回セットアップ一括実行
```

---

## 🏗️ 技術構成

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| データベース | SQLite (Prisma ORM) |
| 認証 | NextAuth.js v4 (Credentials) |
| アイコン | Lucide React |
| フォーム | React Hook Form (サーバーアクション) |

---

## 📁 ディレクトリ構成

```
hr-bpo-system/
├── prisma/
│   ├── schema.prisma       # DBスキーマ定義
│   └── seed.ts             # 初期データ投入スクリプト
├── src/
│   ├── app/
│   │   ├── (dashboard)/    # 認証済みページ群
│   │   │   ├── page.tsx              # ダッシュボード
│   │   │   ├── candidates/           # 求職者管理
│   │   │   ├── projects/             # 案件管理
│   │   │   ├── interviews/           # 面談管理
│   │   │   ├── communications/       # 連絡履歴
│   │   │   └── progress/             # 進捗管理
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth
│   │   │   └── upload/               # PDFアップロード
│   │   └── login/                    # ログイン画面
│   ├── components/
│   │   ├── layout/         # Sidebar, Header, Shell
│   │   ├── candidates/     # 求職者フォーム, PDF
│   │   ├── projects/       # 案件フォーム
│   │   ├── interviews/     # 面談フォーム
│   │   ├── communications/ # 連絡フォーム
│   │   └── ui/             # 共通UI (Badge, Button等)
│   ├── lib/
│   │   ├── prisma.ts       # Prismaクライアント
│   │   ├── auth.ts         # NextAuth設定
│   │   ├── matching.ts     # マッチングアルゴリズム
│   │   ├── utils.ts        # ユーティリティ関数
│   │   └── actions/        # サーバーアクション
│   └── types/
│       └── index.ts        # 型定義・ステータス定数
├── public/
│   └── uploads/            # アップロードされたPDFファイル
├── .env                    # 環境変数（要設定）
├── .env.example            # 環境変数テンプレート
└── README.md
```

---

## 🗃️ データベース設計

### テーブル一覧

| テーブル | 説明 |
|---------|------|
| `User` | システムユーザー |
| `Candidate` | 求職者情報 |
| `CandidateSkillDetail` | 求職者スキル詳細 |
| `CandidateDocument` | スキルシート等書類 |
| `Project` | 案件情報 |
| `Interview` | 面談記録 |
| `Communication` | 連絡履歴 |
| `Match` | マッチング結果 |

### 求職者ステータス

| 値 | 表示名 |
|----|--------|
| APPLIED | 応募あり |
| REGISTERED | システム登録済み |
| SKILLSHEET_RECV | スキルシート受領済み |
| INTRODUCING | 案件紹介中 |
| INTERVIEW_DATE_COLLECTING | 面談日回収 |
| INTERVIEW_DATE_CONFIRMED | 面談日確定 |
| INTERVIEWED | 面談実施 |
| PASSED | 合格 |
| FAILED | 不合格 |
| ON_HOLD | 保留 |

### 案件ステータス

| 値 | 表示名 |
|----|--------|
| RECRUITING | 募集中 |
| PROPOSING | 候補者提案中 |
| INTERVIEWING | 面談中 |
| DECIDED | 決定 |
| CLOSED | 終了 |

---

## 🔄 マッチングアルゴリズム

ルールベースのシンプルなスコアリングで算出します。

| 条件 | 配点 |
|------|------|
| スキル一致（IS/IF/SaaS/ツール） | 最大30点 |
| 単価範囲内 | 最大25点 |
| 勤務形態一致 | 20点 |

スコアが高い順に上位5〜8件を表示します。

---

## 🔐 認証

- メールアドレス + パスワードによる認証
- セッション有効期間: 30日
- パスワードは bcrypt でハッシュ化

---

## 📱 レスポンシブ対応

- PC: サイドバー常時表示 + テーブルビュー
- スマホ: ハンバーガーメニュー + カードビュー

---

## 🔧 環境変数

`.env` ファイルを作成し以下を設定してください（`.env.example` を参考に）：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="ランダムな秘密鍵"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_PASSWORD="admin1234"
```

---

## 🚧 初期版で未実装のもの

- LINE公式アカウント連携（手入力で代替）
- メール自動送信・通知
- 高度な権限管理（ロール別アクセス制御）
- 求職者ステータス変更履歴
- CSVエクスポート機能
- 高度なAIスコアリング
- カレンダー連携
- 複数ファイルの一括アップロード

---

## 🗺️ 今後の拡張案

### Phase 2（近期）
- **LINE Messaging API 連携**
  - 求職者へのLINE送信機能
  - LINE経由での連絡履歴自動記録
  - Webhook設定: `POST /api/webhooks/line`
- **ステータス変更履歴** テーブル追加
- **CSVインポート/エクスポート** 機能
- **メール送信** (Nodemailer or Resend)

### Phase 3（中期）
- **Supabase / PostgreSQL** への移行（本番環境向け）
- **ファイルストレージ** S3 または Supabase Storage への移行
- **通知機能**: 連絡漏れ・面談前日リマインド
- **管理者ダッシュボード**: スタッフ別KPIなど

### LINE連携を追加する場合の方針

1. `prisma/schema.prisma` に `lineUserId` フィールドを `Candidate` に追加
2. `/api/webhooks/line` ルートを作成し LINE Webhook を受け取る
3. `Communication` レコードに LINE チャンネルの連絡を自動記録
4. LINE Messaging API SDK（`@line/bot-sdk`）をインストール
5. 管理画面からの LINE 送信ボタンを各求職者詳細に追加

```typescript
// 将来の実装イメージ
// src/app/api/webhooks/line/route.ts
import { Client } from '@line/bot-sdk'

export async function POST(req: Request) {
  const events = await req.json()
  for (const event of events.events) {
    if (event.type === 'message') {
      // 求職者を lineUserId で検索し、通信履歴に自動追記
    }
  }
}
```

---

## 📞 サポート

不具合や機能要望は社内の担当者まで連絡してください。
