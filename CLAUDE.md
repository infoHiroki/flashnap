# Flashnap

階層構造で写真を整理・番号管理するPWA

## 技術スタック

- PWA（単一HTMLファイル）
- Vanilla JS（フレームワークなし）
- IndexedDB（データ保存）
- JSZip（バンドル、オフライン対応）
- Google Drive API（クラウド同期）

## ファイル構成

```
flashnap/
├── index.html           # メインアプリ（HTML/CSS/JS全部入り）
├── manifest.json        # PWAマニフェスト
├── sw.js                # Service Worker
├── lib/
│   └── jszip.min.js
├── tests/
│   └── app.spec.js      # E2Eテスト（Playwright）
├── playwright.config.js # テスト設定
├── package.json
├── CLAUDE.md
└── REQUIREMENTS.md
```

## テスト

```bash
npm test        # テスト実行
npm run test:ui # UIモードで実行
```

## デプロイ

```bash
npx wrangler pages deploy . --project-name=flashnap
```
本番URL: https://flashnap.pages.dev

## 主要機能

### 調査管理
- 複数調査を同時管理
- 調査の作成・切り替え・削除

### 階層構造管理
- 自由な深さで階層作成（建物 > フロア > 部位 など）
- 各階層で番号は独立
- 切り替えても続きから再開
- 階層名の編集・削除

### テンプレート
- 階層構造のテンプレート作成
- 新規調査へのテンプレート適用

### 撮影機能
- 標準カメラ使用（`<input type="file" capture="environment">`）
- 撮影時にリネームしてIndexedDB保存
- 撮影時に4:3自動クロップ
- 直前の撮影取り消し

### Google Drive連携
- 撮影時にGoogle Driveへ自動アップロード
- フォルダ構成: `Flashnap/調査名/ファイル名.jpg`
- オフライン対応（同期キューに蓄積、オンライン復帰で自動処理）
- 最大3回リトライ
- デバイス保存（Downloadsフォルダ）はON/OFF可能

### 連番設定
- デフォルト設定（アプリ全体）
- 調査ごとに上書き可能
- カスタム項目:
  - 桁数（2〜4桁）
  - ゼロ埋め（あり/なし）
  - 開始番号（0 or 1）
  - プレフィックス
  - 区切り文字

### エクスポート
- フォルダ分け + リネーム済みZIP出力
- 写真一覧表示
- 個別削除可能

### 設定
- Google Drive接続/解除
- 今すぐ同期（同期キュー手動処理）
- デバイスに保存ON/OFF
- アプリを更新（SW/キャッシュ削除）
- データをリセット（写真・階層を全削除）
- ダークモード切り替え

## 前身

- InspectionFlash（React Native/Expo）→ PWA化
- パス: `/Users/hirokitakamura/Dev/inspectionFlash`
