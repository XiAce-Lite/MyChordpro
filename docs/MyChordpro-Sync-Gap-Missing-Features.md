# MyChordpro 同期ギャップ: 未実装機能一覧

## 概要

`chordwiki_personal` との機能・UX 同期方針のうち、**既に一通り対応済みのトップ／曲詳細の状態モデル、`localStorage` 移行、編集時のタグ正規化などとは別軸で**、編集ページとオートスクロール周りに残っているギャップを整理する。

### 実装しない（固定仕様）

- セットリスト共有・公開 URL での楽曲共有。
- GitHub → MS の認証統合、`ownerId` 境界のゆるめ。
- 他ユーザーの楽曲データを URL だけで見える状態にすること。

これらと矛盾しない範囲で、`chordwiki_personal` にある操作性を移植する対象となる。

---

## ギャップ一覧（サマリ）

| ID | 領域 | 内容 | chordwiki_personal の主参照 | MyChordpro の現状 |
|----|------|------|-------------------------------|-------------------|
| G1 | 編集 | CodeMirror 6 による ChordPro 編集（シンタックス強調・アクティブ行・入力補助） | `frontend/js/chordpro-cm6.js`, `frontend/edit.html` の importmap / マウント | `textarea` のみ、`chordpro-cm6.js` 無し |
| G2 | 編集 | エディタ隣のライブプレビュー（デバウンス再描画、レイアウト／リサイズ） | `frontend/edit.html`（プレビュー領域・CSS）、`frontend/js/edit.js` | プレビュー列なし |
| G3 | 曲詳細 | オートスクロール中の現在行フォーカス（オーバーレイハイライト、ON/OFF、前後コンテキスト行数、必要に応じた残り時間等） | `frontend/song.html`, `frontend/js/song-autoscroll.js`, `frontend/js/song.js`（トグルイベント） | ハイライト用 DOM・状態・イベントなし |

---

## G1: 編集画面 CodeMirror 6（未実装）

### chordwiki_personal での狙い

- ChordPro 向けハイライトとアクティブ行表示で編集負荷を下げる。
- `[]` / `{}` の補完やルート音の大文字化など、入力時の細かな補助（`chordpro-cm6.js` に集約）。
- CDN ESM（`importmap` + モジュールスクリプト）で読み込み、`edit.js` がテキストの取得／保存との橋渡しを行う。

### MyChordpro で必要な作業（実装フェーズ）

- `frontend/js/chordpro-cm6.js` を新規追加し、`chordwiki_personal` 相当の公開 API・テーマ／言語パッケージ依存関係を揃える（パス・アセットは MyChordpro 側に合わせる）。
- `frontend/edit.html` にマウント用要素、`importmap`、CM6 用スタイル読み込みを追加。
- `frontend/js/edit.js` で初期値セット・フォーム送信時の本文読み替え・破棄時のクリーンアップを textarea から CM6 に切り替える。

### 受入観点（案）

- 追加／編集モードで本文が CM6 に表示され、保存ペイロードに正しく載る。
- 既存のタグ／YouTube／メタ入力フローのみでは本文が欠落しない。
- ブラウザの戻る／離脱時に異常なコンソールエラーが出ない。

---

## G2: 編集ライブプレビュー（未実装）

### chordwiki_personal での狙い

- ChordPro ソースを入力しつつ、`chordwiki_personal` と同系の見た目で右（または別ペイン）にプレビュー表示する。
- 入力はデバウンスしてパフォーマンスを抑え、レイアウトはリサイズ可能にすることが多い。

### MyChordpro で必要な作業（実装フェーズ）

- 曲詳細と同様のレンダラー（既存の ChordPro 描画関数）を再利用し、`edit.js` からデバウンス更新で呼ぶ。
- `edit.html` にプレビュー用コンテナとスタイル、`chordwiki_personal` に近い 2 カラム（エディタ | プレビュー）を確保する。

### 受入観点（案）

- `{title}` や `{chorus}`、`[` `]` の変更が数百 ms 単位でプレビューに反映される（極端なタイピングでも固まらない）。
- プレビューは詳細ページの表示方針（等幅／コード着色があれば整合）と大きく矛盾しない。
- CM6 と併せたときにカーソル位置とプレビューが論理的に矛盾しない（完全一致は任意だがズレ過ぎないこと）。

---

## G3: オートスクロール ハイライト（未実装）

### chordwiki_personal での狙い

- スクロールに追従して「読むべき付近」を視覚的に強調する（画面上のオーバーレイ）。
- ユーザー設定: ハイライトの ON/OFF、前後コンテキスト行数（入力 UI は `song.html`、状態はオートスクロール状態と連動）。
- `song-autoscroll.js` 内でオーバーレイ位置・高さを更新し、`song.js` でトグル等のイベントを繋ぐ。

### MyChordpro で必要な作業（実装フェーズ）

- `song.html`: `autoscroll-focus-overlay`、`autoscroll-highlight-toggle`、`autoscroll-highlight-context-lines`（および必要なラベル・ARIA）を追加。`song.html` 内の関連 CSS を移植または共通化。
- `song-autoscroll.js`: オーバーレイ計算・`highlightEnabled`・永続化キーとの整合を `chordwiki_personal` に合わせて移植（MyChordpro の既存 `autoScrollState` と衝突しないよう統合）。
- `song-core.js` / `song.js`: 状態の初期値とイベント結線を追加（`chordwiki_personal` の `song.js` の該当リスナを参照）。
- 「残り時間」など `chordwiki_personal` にあって MyChordpro に無いサブ要素があれば、仕様書 `MyChordpro-UI-Detailed-Design-Draft.md` と照合しつつ追加可否を決める。

### 受入観点（案）

- オートスクロール開始後、スクロール中にハイライト帯が追従する。OFF にすると視覚的強調のみ消え、スクロール挙動は仕様どおり維持。
- `context-lines` を変えたときにフォーカス領域の高さ／位置が妥当に変わる。
- ページリロード後、`localStorage` に保存されていれば設定が復元される（`chordwiki_personal` と同種のキー設計になる場合は `storage-keys.js` との統合も検討）。

---

## 関連ドキュメント

- `docs/MyChordpro-UI-Sync-Handoff.md` — 進捗と次の作業リスト
- `docs/MyChordpro-UI-Detailed-Design-Draft.md` — UI 詳細（オートスクロール・編集）
- `docs/MyChordpro-UI-Sync-Acceptance-Checklist.md` — 上記 G1〜G3 対応後に項目追加・検証が必要

---

## 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-05-08 | 初版（G1〜G3 を設計ギャップとして整理） |
