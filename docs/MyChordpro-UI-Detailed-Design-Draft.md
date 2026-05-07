# MyChordpro UI 詳細仕様書（ドラフト）

## 0. 文書の位置づけ

本書は `MyChordpro-Sync-Overview-Design.md` および `MyChordpro-Sync-Basic-Design.md` を受け、  
`MyChordpro` の UI 実装に必要な詳細仕様を定義する。

本書で扱う対象は UI/状態管理/イベント遷移であり、インフラ詳細は別紙とする。

### 0.1 固定要件（変更不可）

- セットリスト共有機能は実装しない
- 認証方式は GitHub 認証を維持する
- `ownerId` は GitHub principal ベースの分離を維持し、他システムと統合しない
- URL を他者に共有しても、相手側は相手自身の `ownerId` 空間を参照する

## 1. 画面一覧と責務

| 画面 | パス | 主な責務 |
| --- | --- | --- |
| トップ | `/` | 検索、ランキング、タグ候補、ページング |
| 曲詳細 | `/song.html` | ChordPro 表示、練習補助、YouTube、表示設定、オートスクロール |
| 編集 | `/edit.html` | 曲の追加・編集、タグ/YouTube 正規化、保存・削除 |

## 2. トップページ（`/`）詳細仕様

### 2.1 表示要素

#### A. 検索フォーム

- 検索入力: `q`
- 検索対象切替: `target=song|tag`
- Enter 押下で検索を実行
- タグ入力時は候補表示（API を第一候補、失敗時はキャッシュを利用）

#### B. ランキング/検索結果リスト

- 表示項目: 曲タイトル、アーティスト、タグ、`display_score`、最終閲覧日（存在時）
- 行クリックで曲詳細へ遷移（`/song.html?id=...&artist=...`）
- 空結果時は空状態メッセージを表示

#### C. ページング

- `page` クエリと同期
- `page=1` は `/` に正規化
- 先頭/末尾/現在近傍ページを表示

### 2.2 状態モデル

- `idle`: 初期状態
- `loading`: API 呼出中
- `ready`: 一覧表示可能
- `error`: API エラー

状態遷移:

- `idle -> loading -> ready`
- `idle -> loading -> error`
- `error -> loading -> ready`（再試行）

### 2.3 挙動仕様

#### A. 初期表示

- `q` 未指定: ランキング API を呼ぶ
- `q` 指定: 検索 API を呼ぶ

#### B. URL 同期

- `q`, `target`, `page` を UI と双方向同期
- ページ切替時は `history.pushState` を使用
- ブラウザ戻る/進むで再描画する

#### C. エラー時

- エラーバナーを表示
- 再試行ボタンを表示
- リスト領域はプレースホルダまたは直前表示を保持し、レイアウト崩壊を防ぐ

## 3. 曲詳細ページ（`/song.html`）詳細仕様

### 3.1 表示要素

#### A. ChordPro 表示領域

- ベースフォント: 等幅系（既定はプロジェクトCSS準拠、`Meiryo UI` 優先指定可）
- 行番号は表示しない
- コードは既存テーマに従って色分け
- 狭幅時は横スクロール fallback を許可

#### B. Song Controls

- 移調（`-` / `+` / `Reset`）
- 表記切替（現行実装のモード仕様に準拠）
- 表示設定（フォントサイズ、行間、テーマ）
- 注釈（ローカル保存）
- 手書き（ローカル保存）
- オートスクロール（開始/停止/速度/マーカー）

#### C. Tags / YouTube パネル

- 折りたたみ可能
- 折りたたみ状態を localStorage へ保存
- YouTube ミニプレイヤー（`id + start`）を表示

### 3.2 状態モデル

- `loading`: 曲読込中
- `ready`: 曲表示中
- `partial_error`: 補助機能の一部失敗
- `fatal_error`: 曲本体取得失敗

### 3.3 挙動仕様

#### A. 閲覧スコア更新

- 曲表示後 1 秒遅延で非同期実行
- 失敗時はログ記録のみで UI は維持

#### B. 折りたたみ状態

- 保存キー（推奨）: `mcp_panel_state:{artist}:{id}`
- 値: `{ tags: boolean, youtube: boolean, controls: boolean }`

#### C. 表示設定

- 保存キー（推奨）: `mcp_display_settings:v1`
- 値: `{ fontSize: number, lineHeight: number, theme: string }`

#### D. 移調

- 保存キー（推奨）: `mcp_transpose:{artist}:{id}`
- 値: `-12` 〜 `+12` の整数

#### E. 注釈

- 保存キー（推奨）: `mcp_notes:{artist}:{id}`
- 値: ノート配列またはテキスト（実装互換を優先）

#### F. 手書き

- 保存キー（推奨）: `mcp_canvas:{artist}:{id}`
- 値: ストロークJSONを第一候補（Base64 PNG はフォールバック）

## 4. オートスクロール UI 詳細仕様

### 4.1 表示要素

- `Start` / `Stop` ボタン
- 速度スライダー（`1..10`）
- 経過時間表示
- 開始/終了マーカー
- スクロール中のコンパクト表示

### 4.2 挙動仕様

#### A. 開始

- 現在スクロール位置を基準に開始
- 速度設定を localStorage に保存（`mcp_scroll_speed`）

#### B. 停止/再開

- 停止時のスクロール位置を保持
- 再開時は保持位置から継続

#### C. マーカー

- 開始/終了マーカーはクリックまたはドラッグで設定
- 終了マーカー到達で自動停止

#### D. 速度計算

- `pxPerSec = basePxPerSec * speedFactor`
- `basePxPerSec` は表示領域高さと目標時間から算出

## 5. YouTube パネル UI 詳細仕様

### 5.1 表示要素

- YouTube ID
- `start` 秒
- ミニプレイヤー（iframe）
- 再生/停止
- シーク操作（必要に応じて有効）

### 5.2 挙動仕様

- 再生開始は `start` 秒を尊重
- 再生状態とオートスクロール状態は独立
- 動画終了時もオートスクロールは継続（自動停止しない）

## 6. 編集ページ（`/edit.html`）詳細仕様

### 6.1 表示要素

- `title`
- `slug`
- `artist`
- `tags`
- `youtube`
- `chordPro`
- 保存/削除ボタン

### 6.2 挙動仕様

#### A. `mode=add`

- `slug` 自動生成
- `youtube` 正規化
- 空タグ除外

#### B. `mode=edit`

- 既存値をロード
- 削除ボタンを有効化

#### C. 保存

- 入力正規化後に API 送信
- `ownerId` は API 側で principal から解決
- `updatedAt` を更新

## 7. localStorage 詳細仕様

| 機能 | key（推奨） | 値 |
| --- | --- | --- |
| 折りたたみ | `mcp_panel_state:{artist}:{id}` | `{tags, youtube, controls}` |
| 表示設定 | `mcp_display_settings:v1` | `{fontSize, lineHeight, theme}` |
| 移調 | `mcp_transpose:{artist}:{id}` | 整数 |
| 注釈 | `mcp_notes:{artist}:{id}` | テキストまたはノート配列 |
| 手書き | `mcp_canvas:{artist}:{id}` | ストロークJSON（必要時Base64） |
| スクロール速度 | `mcp_scroll_speed` | 数値 |

補足:

- 既存キーがある場合は読み込み時に自動移行する
- JSON 解析失敗時は該当キーを破棄し、初期値で続行する

## 8. エラー時 UI 詳細仕様

### 8.1 API 失敗時

- トップ: エラーバナー + 再試行
- 曲詳細: ChordPro 本体優先、補助パネルのみ段階的に無効化
- 編集: 保存をブロックし、原因メッセージを表示

### 8.2 localStorage 破損時

- 破損キーを削除
- 初期値で再描画
- 画面表示の継続を優先

## 9. 受入基準（UI 観点）

- `chordwiki_personal` と同等の操作導線を持つ
- 折りたたみ状態が保持される
- 表示設定が再訪問時に再適用される
- オートスクロールが開始/停止/再開できる
- YouTube 再生が `start` 秒から始まる
- 編集入力の正規化が期待通りに動作する
- 共有 UI が存在しない
- 認証境界と `ownerId` 境界が維持される

## 10. 実装メモ（ドラフト段階）

- 既存実装とのキー差異があるため、キー移行関数を最初に導入する
- 既存機能回帰を避けるため、トップ/曲詳細/編集の順で段階導入する
- UI 同期は見た目ではなく、状態永続化と復元の一致を完了条件とする
