# MyChordpro UI同期 受入手順書（localhost:18080）

## 1. 前提

- 本手順は `MyChordpro` の UI同期受入確認用。
- ローカル配信ポートは `18080` を使用する（`8080` は使用しない）。
- 対象 URL: `http://localhost:18080`
- 確認対象:
  - トップページ（検索・ランキング・タグ候補・ページング）
  - 曲詳細（表示/状態保存/YouTube/オートスクロール）
  - 編集（タグ/YouTube 正規化）
  - 共有機能が混入していないこと

## 2. 起動手順

1. `frontend` ディレクトリで静的サーバを起動する。
   - 例: `py -m http.server 18080`
2. Cursor内ブラウザで `http://localhost:18080` を開く。

## 3. 使用サンプルデータ

- `local-sync-check`（状態保存確認用）
- `local-edit-normalize`（編集正規化確認用）
- 既存の長尺サンプル:
  - `local-long-scroll-sample`
  - `local-long-line-test`
  - `local-seventh-moon`

## 4. 受入チェック（手動）

## 4.1 トップページ

- [x] 初期表示でランキングが出る（`q` なし）
- [X] `q` 入力で検索結果表示に切り替わる
- [X] `target=song|tag` 切替が機能する
- [X] タグ候補が表示される（tag検索時）
- [X] ページング操作で URL が同期される
- [X] ブラウザ戻る/進むで状態が復元される
- [ ] API停止時にエラー表示と再試行が見える

## 4.2 曲詳細ページ

- [X] `local-sync-check` を開いて譜面表示される
- [X] Song Controls の折りたたみが動作する
- [X] Tags/YouTube パネル折りたたみが動作する
- [X] 移調・表記切替が反映される
- [X] 表示設定変更後、再読込でも維持される
- [X] 閲覧後 1 秒程度で score 更新処理が走る（失敗時も画面維持）
- [X] YouTube が `start` 秒から再生される
- [X] オートスクロール Start/Stop/再開が動作する

## 4.3 編集ページ

- [ ] `mode=edit` で `local-edit-normalize` を読み込み表示できる
- [ ] tags に空白区切り/改行混在入力して保存時に正規化される
- [ ] youtube に `id`, `id?t=42`, URL を混在入力して正規化される
- [ ] 空タグが保存時に除外される
- [ ] `mode=add` で slug 自動追従が効く

## 4.4 非機能・境界

- [ ] 共有UI（setlists, 公開リンク）が存在しない
- [ ] URL共有しても他者データ閲覧機能がない
- [ ] 認証方式は GitHub 前提（MS統合なし）

## 5. 自動実施結果（今回）

実施日時: 2026-05-08

- [x] `http://localhost:18080/` が 200
- [x] `http://localhost:18080/.local/local-test-songs.js` が 200
- [x] `http://localhost:18080/.local/local-test-song.js` が 200
注記:

- Cursor内ブラウザのクリック操作を伴う項目は、ユーザー側の手動確認が必要。
- 上記手動チェック完了をもって最終受入完了とする。
