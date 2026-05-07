# MyChordpro UI同期 引き継ぎメモ

最終更新: 2026-05-08

## 1. 目的と固定条件

- `MyChordpro` を `chordwiki_personal` に機能同期する
- ただし以下は絶対維持:
  - セットリスト共有機能は実装しない
  - 認証は GitHub のまま（MS 認証へ統合しない）
  - `ownerId` は GitHub principal ベース分離を維持
  - URL を共有しても他者データは見えない

## 2. 今回までの進捗（実装済み）

## 2.1 設計ドキュメント作成済み

- `docs/MyChordpro-Sync-Overview-Design.md`
- `docs/MyChordpro-Sync-Basic-Design.md`
- `docs/MyChordpro-UI-Detailed-Design-Draft.md`
- `docs/MyChordpro-UI-Sync-Acceptance-Checklist.md`

## 2.2 トップページ同期（主要）

- `frontend/js/index.js` を更新
  - 状態モデル: `idle/loading/ready/error`
  - URL 同期: `pushState/replaceState` 使い分け
  - ページング/検索/タグ候補連動
  - エラー表示 + 再試行 UI

## 2.3 曲詳細ページ同期（主要）

- 状態モデル導入
  - `loading/ready/partial_error/fatal_error`
  - `songPageState` を `body.dataset.songPageState` に反映
- 閲覧スコア更新を 1 秒遅延非同期化
- 失敗時に `partial_error` へ遷移

## 2.4 localStorage キー移行の導入

- `frontend/js/shared/storage-keys.js` を拡張
  - 新キー:
    - `mcp_panel_state:{id}`
    - `mcp_display_settings:v1`
    - `mcp_transpose:{id}`
    - `mcp_notes:v1:{id}`
    - `mcp_canvas:v1:{id}`
    - `mcp_scroll_speed`
  - 旧キーからの自動移行関数 `migrateSongStorage` 実装
- 曲ロード時に移行実行 (`frontend/js/song.js`)
- 移調値保存を `mcp_transpose:{id}` へ接続
- 注釈/手書き保存を `mcp_notes`/`mcp_canvas` へ接続
- 折りたたみ状態を `mcp_panel_state:{id}` へ接続
- スクロール速度を `mcp_scroll_speed` へ接続

## 2.5 編集正規化の補強

- `normalizeTagsInput` を改修（空白/改行混在を正規化）
- 空タグ除外処理を維持
- YouTube の正規化/検証フローは既存運用継続

## 2.6 ローカル検証環境・サンプル追加

- ポート `18080` で起動確認済み
- `.local` サンプル追加済み:
  - `local-sync-check`
  - `local-edit-normalize`
- 追加先:
  - `frontend/.local/local-test-songs.js`
  - `frontend/.local/local-test-song.js`

## 3. 未完了（機能漏れ）

## 3.1 編集画面の CodeMirror 6 同期（未実装）

- `MyChordpro` に `frontend/js/chordpro-cm6.js` が未導入
- `frontend/edit.html` も CM6 用 `importmap` / module script / mount DOM が未同期
- CM6 キー補助（`[]`/`{}` 補完、a-g 大文字化等）未提供

## 3.2 編集画面ライブプレビュー（未実装）

- `chordwiki_personal` 側にあるエディタ隣接プレビュー、デバウンス再描画、リサイザが未移植
- `MyChordpro` 編集画面は現状 textarea 単体

## 3.3 オートスクロールのハイライト機能（未実装）

- `song.html` に以下 UI が未追加
  - `autoscroll-focus-overlay`
  - `autoscroll-highlight-toggle`
  - `autoscroll-highlight-context-lines`
  - 残り時間表示 UI
- `song-autoscroll.js` に対応ロジック未移植

## 4. デプロイ前/後の確認ポイント

- デプロイ前:
  - `docs/MyChordpro-UI-Sync-Acceptance-Checklist.md` の手順で最低限チェック
- デプロイ後（重要）:
  - 認証境界（GitHubログイン）
  - `ownerId` 境界（他ユーザーデータ不可視）
  - 編集 API の認可挙動
  - URL共有時の分離挙動

## 5. 次チャットで最初に依頼すべき作業

1. CodeMirror 6 導入を `edit.html`/`edit.js`/新規 `chordpro-cm6.js` で実装
2. 編集ライブプレビューを `chordwiki_personal` 相当で移植
3. オートスクロールのハイライト UI/ロジックを `song.html`/`song-autoscroll.js` へ移植
4. 受入チェックシート更新 + 実施結果反映

## 6. 参照元（比較に使った主ファイル）

- `chordwiki_personal/frontend/edit.html`
- `chordwiki_personal/frontend/js/edit.js`
- `chordwiki_personal/frontend/js/chordpro-cm6.js`
- `chordwiki_personal/frontend/song.html`
- `chordwiki_personal/frontend/js/song-autoscroll.js`
- `MyChordpro/frontend/edit.html`
- `MyChordpro/frontend/js/edit.js`
- `MyChordpro/frontend/song.html`
- `MyChordpro/frontend/js/song-autoscroll.js`

