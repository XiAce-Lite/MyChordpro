(function attachChordWikiStorageKeys(global) {
  const LEGACY = Object.freeze({
    STICKY_NOTES_STORAGE_PREFIX: 'annotations:v1',
    INK_STORAGE_PREFIX: 'annotations-ink:v1',
    DISPLAY_PREFS_STORAGE_KEY: 'displayPrefs:v1',
    SONG_PREFS_STORAGE_PREFIX: 'prefs:v1',
    AUTO_SCROLL_COLLAPSED_STORAGE_KEY: 'autoscrollCollapsed',
    SONG_EXTRAS_COLLAPSED_STORAGE_KEY: 'songExtrasCollapsed'
  });

  const KEYS = Object.freeze({
    AUTO_SCROLL_STORAGE_PREFIX: 'autoscroll:v1',
    SONG_PREFS_STORAGE_PREFIX: 'prefs:v1',
    STICKY_NOTES_STORAGE_PREFIX: 'mcp_notes:v1',
    INK_STORAGE_PREFIX: 'mcp_canvas:v1',
    MCP_PANEL_STATE_PREFIX: 'mcp_panel_state',
    MCP_TRANSPOSE_PREFIX: 'mcp_transpose',
    MCP_SCROLL_SPEED_KEY: 'mcp_scroll_speed',
    AUTO_SCROLL_COLLAPSED_STORAGE_KEY: 'autoscrollCollapsed',
    SONG_EXTRAS_COLLAPSED_STORAGE_KEY: 'songExtrasCollapsed',
    DISPLAY_PREFS_STORAGE_KEY: 'mcp_display_settings:v1',
    DISPLAY_PREFS_COLLAPSED_STORAGE_KEY: 'displayPrefsCollapsed',
    AUTOSCROLL_SECTION_COLLAPSED_STORAGE_KEY: 'autoscrollSectionCollapsed',
    TRANSPOSE_NOTATION_COLLAPSED_STORAGE_KEY: 'transposeNotationCollapsed',
    ANNOTATION_SECTION_COLLAPSED_STORAGE_KEY: 'annotationSectionCollapsed',
    INK_TOOLBAR_COLLAPSED_STORAGE_KEY: 'inkToolbarCollapsed',
    INK_COLOR_STORAGE_KEY: 'inkColorPreference',
    INK_WIDTH_STORAGE_KEY: 'inkWidthPreference'
  });

  function normalizeSongId(id) {
    return String(id || '').trim();
  }

  function normalizeArtist(artist) {
    return String(artist || '').trim();
  }

  function buildSongIdKey(prefix, id) {
    const safeId = normalizeSongId(id);
    return safeId ? `${prefix}:${safeId}` : '';
  }

  function buildSongScopedKey(prefix, artist, id) {
    if (String(prefix || '').startsWith('mcp_')) {
      return buildSongIdKey(prefix, id);
    }
    return `${prefix}:${artist}:${id}`;
  }

  function getPanelStateKey(id) {
    return buildSongIdKey(KEYS.MCP_PANEL_STATE_PREFIX, id);
  }

  function getTransposeStorageKey(id) {
    return buildSongIdKey(KEYS.MCP_TRANSPOSE_PREFIX, id);
  }

  function getNotesStorageKey(id) {
    return buildSongIdKey(KEYS.STICKY_NOTES_STORAGE_PREFIX, id);
  }

  function getCanvasStorageKey(id) {
    return buildSongIdKey(KEYS.INK_STORAGE_PREFIX, id);
  }

  function readPanelState(id) {
    const key = getPanelStateKey(id);
    if (!key) {
      return {};
    }

    try {
      const raw = global.localStorage?.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function writePanelState(id, partialState = {}) {
    const key = getPanelStateKey(id);
    if (!key) {
      return {};
    }

    const nextState = {
      ...readPanelState(id),
      ...(partialState && typeof partialState === 'object' ? partialState : {})
    };

    try {
      global.localStorage?.setItem(key, JSON.stringify(nextState));
    } catch {
      // noop
    }

    return nextState;
  }

  function safeParseJson(value, fallback = null) {
    if (!String(value || '').trim()) {
      return fallback;
    }
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function copyIfMissing(storage, fromKey, toKey, transform = (value) => value) {
    if (!storage || !fromKey || !toKey || fromKey === toKey) {
      return false;
    }

    const targetExists = storage.getItem(toKey);
    if (targetExists !== null && targetExists !== '') {
      return false;
    }

    const sourceValue = storage.getItem(fromKey);
    if (sourceValue === null || sourceValue === '') {
      return false;
    }

    const nextValue = transform(sourceValue);
    if (nextValue === null || typeof nextValue === 'undefined' || nextValue === '') {
      return false;
    }

    storage.setItem(toKey, String(nextValue));
    return true;
  }

  function migrateSongStorage({ artist = '', id = '' } = {}) {
    const storage = global.localStorage;
    const safeId = normalizeSongId(id);
    const safeArtist = normalizeArtist(artist);
    if (!storage || !safeId) {
      return;
    }

    const legacyNotesKey = buildSongScopedKey(LEGACY.STICKY_NOTES_STORAGE_PREFIX, safeArtist, safeId);
    const legacyCanvasKey = buildSongScopedKey(LEGACY.INK_STORAGE_PREFIX, safeArtist, safeId);
    const nextNotesKey = getNotesStorageKey(safeId);
    const nextCanvasKey = getCanvasStorageKey(safeId);
    copyIfMissing(storage, legacyNotesKey, nextNotesKey);
    copyIfMissing(storage, legacyCanvasKey, nextCanvasKey);

    copyIfMissing(storage, LEGACY.DISPLAY_PREFS_STORAGE_KEY, KEYS.DISPLAY_PREFS_STORAGE_KEY);

    const transposeKey = getTransposeStorageKey(safeId);
    copyIfMissing(
      storage,
      buildSongScopedKey(LEGACY.SONG_PREFS_STORAGE_PREFIX, safeArtist, safeId),
      transposeKey,
      (raw) => {
        const parsed = safeParseJson(raw, {});
        const transpose = Number(parsed?.transposeSemitones);
        if (!Number.isFinite(transpose)) {
          return '';
        }
        return String(Math.trunc(transpose));
      }
    );

    const panelStateKey = getPanelStateKey(safeId);
    if (!storage.getItem(panelStateKey)) {
      const controlsCollapsed = storage.getItem(LEGACY.AUTO_SCROLL_COLLAPSED_STORAGE_KEY) === '1';
      const extrasCollapsed = storage.getItem(LEGACY.SONG_EXTRAS_COLLAPSED_STORAGE_KEY) === '1';
      const panelState = {
        controls: !controlsCollapsed,
        tags: !extrasCollapsed,
        youtube: !extrasCollapsed
      };
      storage.setItem(panelStateKey, JSON.stringify(panelState));
    }

    if (!storage.getItem(KEYS.MCP_SCROLL_SPEED_KEY)) {
      const songAutoScrollKey = buildSongScopedKey(KEYS.AUTO_SCROLL_STORAGE_PREFIX, safeArtist, safeId);
      const autoScrollState = safeParseJson(storage.getItem(songAutoScrollKey), null);
      const speedValue = Number(autoScrollState?.speedMultiplier);
      if (Number.isFinite(speedValue) && speedValue > 0) {
        storage.setItem(KEYS.MCP_SCROLL_SPEED_KEY, String(speedValue));
      }
    }
  }

  global.ChordWikiStorageKeys = Object.freeze({
    ...KEYS,
    LEGACY,
    buildSongIdKey,
    buildSongScopedKey
    ,
    getPanelStateKey,
    getTransposeStorageKey,
    getNotesStorageKey,
    getCanvasStorageKey,
    readPanelState,
    writePanelState,
    migrateSongStorage
  });
})(window);
