# Flashnap

階層構造で写真を整理・番号管理するPWA

## Demo

https://flashnap.pages.dev

## Features

- **調査管理** - 複数の調査を同時管理、切り替え可能
- **階層構造** - 建物 > フロア > 部位 など自由な深さで整理
- **自動連番** - 各階層で独立した番号管理、切り替えても続きから再開
- **Google Drive同期** - 撮影時に自動アップロード、オフライン対応
- **エクスポート** - フォルダ分け＆リネーム済みZIP出力
- **テンプレート** - 階層構造を再利用
- **オフライン動作** - PWAとして完全オフライン対応

## Tech Stack

- PWA（単一HTMLファイル）
- Vanilla JS
- IndexedDB
- JSZip
- Google Drive API

## Local Development

```bash
# 依存関係インストール
npm install

# ローカルサーバー起動
npx serve .

# テスト実行
npm test
```

## Deploy

```bash
npx wrangler pages deploy . --project-name=flashnap
```

## License

MIT
