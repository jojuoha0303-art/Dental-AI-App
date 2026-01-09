# Vercel デプロイメントガイド

## 環境変数の設定

Vercelにデプロイする際は、以下の環境変数を設定してください：

### 方法1: Vercelダッシュボード

1. Vercelプロジェクトの「Settings」→「Environment Variables」を開く
2. 以下の変数を追加：

```
VITE_GEMINI_API_KEY = あなたのGemini APIキー
```

または

```
GEMINI_API_KEY = あなたのGemini APIキー
```

両方設定することを推奨します。

### 方法2: Vercel CLI

```bash
vercel env add VITE_GEMINI_API_KEY
vercel env add GEMINI_API_KEY
```

## デプロイ

```bash
# 初回デプロイ
vercel

# 本番環境へデプロイ
vercel --prod
```

## トラブルシューティング

### 画像生成が失敗する場合

1. ブラウザのコンソールを開く（F12）
2. 以下のエラーログを確認：
   - "API key not found" → 環境変数が設定されていません
   - "400" エラー → APIキーが無効です
   - "403" エラー → APIキーの権限が不足しています

3. 環境変数が正しく設定されているか確認：
   ```bash
   vercel env ls
   ```

4. 環境変数を変更した後は、再デプロイが必要：
   ```bash
   vercel --prod
   ```

### テキスト生成は動くが画像生成だけ失敗する場合

- 以前は `process.env.API_KEY` の参照方法に問題がありました
- 最新版では `getApiKey()` 関数が統一的に処理するため解決済み

## ローカル開発

ローカルでの開発時は `.env` ファイルに以下を記載：

```env
GEMINI_API_KEY=あなたのAPIキー
VITE_GEMINI_API_KEY=あなたのAPIキー
```

**重要**: `.env` ファイルは `.gitignore` に含まれているため、GitHubにプッシュされません。

## 確認方法

デプロイ後、以下を確認してください：

1. ダッシュボードが表示される
2. CSVアップロードが動作する
3. 各種ジェネレーター（スタッフブログ、LINE、画像生成）が動作する

問題が発生した場合は、Vercelのログを確認：
```bash
vercel logs
```
