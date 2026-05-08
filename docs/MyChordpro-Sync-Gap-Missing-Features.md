# MyChordpro 同期ギャップ: 機能ギャップの記録（アーカイブ／サマリ）

## 概要

`chordwiki_personal` との UX 同期で当初残っていた **編集（CM6・プレビュー）、曲詳細のオートスクロールハイライト、個人用セットリスト** について、MyChordpro 側の対応状況を **サマリ表** と **設計上の注記** に集約する。下位の「実装フェーズ」記述は、当時の要件整理として参照用に残したものを削除し、現状は上表と §G1 注記・§G4 を正とする。

### 実装しない（固定仕様）

- セットリスト共有・公開 URL での楽曲共有。
- GitHub → MS の認証統合、`ownerId` 境界のゆるめ。
- 他ユーザーの楽曲データを URL だけで見える状態にすること。

これらと矛盾しない範囲で、`chordwiki_personal` にある操作性を移植する対象となる。

---

## ギャップ一覧（サマリ）

| ID | 領域 | 内容 | chordwiki_personal の主参照 | MyChordpro の現状 |
|----|------|------|-------------------------------|-------------------|
| G1 | 編集 | CodeMirror 6 による ChordPro 編集（シンタックス強調・補助） | `frontend/js/chordpro-cm6.js`, `frontend/edit.html` の importmap | **対応済**。「]」削除時のフリーズは `skipClosingBracket` のガードと、変更時 `changeListeners` の `queueMicrotask` で再入回避（§G1 注記） |
| G2 | 編集 | エディタ隣のライブプレビュー（デバウンス再描画） | `frontend/edit.html`, `frontend/js/edit.js` | **対応済** |
| G3 | 曲詳細 | オートスクロール現在行フォーカス（オーバーレイ・設定 UI・残り時間） | `song.html`, `song-autoscroll.js`, `song.js`, `chordwiki-song.css` | **対応済**（`#autoscroll-focus-overlay` ほか chordwiki と同構造 DOM） |
| G4 | セットリスト | ローカルのみセットリスト CRUD と一覧からの曲追加 | `setlists.html`, `js/shared/setlists.js`, `setlist-ui.js`, `song.html`, `runtime-config.js` | **対応済**。クラウド同期なし（`setlistsCloudSyncEnabled: false`）、キー `mcp_setlists:v1`。個人用のため **`alwaysEnableEditorUi: true`** で編集 UI は常時表示 |

---

## G1 注記: 「]」削除時のフリーズ回避（CodeMirror 6）

編集ページでプレビュー再描画などを変更ハンドラ内で同期的に走らせると、CM6 の更新と再入で UI が固まることがある。MyChordpro では `chordpro-cm6.js` で次を行う。

- `]` / `}` の「閉じ括弧スキップ」時に、カーソルが文書範囲外へ出ないようガードする（`skipClosingBracket`）。
- ドキュメント変更後の `changeListeners` 呼び出しを `queueMicrotask` に載せ、CM6 のトランザクション完了後にプレビュー側が動くようにする。

chordwiki_personal 側の過去対策（行頭状態リセット等の StreamLanguage 時代）とは実装詳細が異なるが、「同期コールバック内での重処理・再入を避ける」という意図は同じである。

---

## G4: セットリスト（MyChordpro 個人用・対応済）

- **保存先**: `localStorage` のキー `mcp_setlists:v1`。`/api/setlists*` は使わず、`ChordWikiRuntime.setlistsCloudSyncEnabled === false` でリモート同期のみ抑止する（データはブラウザ内で完結）。
- **画面**: `/setlists.html`、トップヘッダの「セットリスト」、ランキング／検索行の ⋮ メニュー「セットリストに追加」、曲ページの「セットリストに追加」パネル（`song.html` + `setlists.css`）。
- **編集 UI 常時表示**: 単一ユーザー利用のため `runtime-config.js` の `alwaysEnableEditorUi: true` と、`auth.js` の `isEditor()` 分岐により **`editor-only` を常に表示**（閲覧専用ロールによる非表示にしない）。

### 受入観点（満たすこと）

- セットリストの新規作成・リネーム・削除・曲の並べ替え・曲の削除が `setlists.html` で行える。
- トップ一覧および曲ページからセットリストへの曲追加ができる。

---

## 関連ドキュメント

- `docs/MyChordpro-UI-Sync-Handoff.md` — 進捗と次の作業リスト
- `docs/MyChordpro-UI-Detailed-Design-Draft.md` — UI 詳細（オートスクロール・編集）
- `docs/MyChordpro-UI-Sync-Acceptance-Checklist.md` — 受入チェック
- `docs/MyChordpro-Sync-Basic-Design.md` — 境界条件（セットリスト API 非採用など）

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-08 | 初版（G1〜G3 を設計ギャップとして整理） |
| 2026-05-08 | G1〜G4 を対応済サマリに更新。CM6 の「]」削除注記およびセットリスト個人用設計を追記 |
