(function attachChordWikiRuntime(global) {
  const DEFAULT_LOCAL_API_ORIGIN = 'http://localhost:7071';

  function trimTrailingSlash(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function isLocalPreview(locationLike = global.location) {
    const protocol = String(locationLike?.protocol || '');
    const hostname = String(locationLike?.hostname || '').toLowerCase();
    return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
  }

  function getApiOrigin() {
    const explicitOrigin = trimTrailingSlash(global.__CHORDWIKI_API_ORIGIN__);
    if (explicitOrigin) {
      return explicitOrigin;
    }

    try {
      const savedOrigin = trimTrailingSlash(global.localStorage?.getItem('chordwiki:apiOrigin'));
      if (savedOrigin) {
        return savedOrigin;
      }
    } catch (error) {
      console.warn('Failed to read chordwiki:apiOrigin from localStorage:', error);
    }

    return isLocalPreview() ? DEFAULT_LOCAL_API_ORIGIN : '';
  }

  function buildApiUrl(path) {
    const rawPath = String(path || '').trim();
    if (!rawPath) {
      return getApiOrigin() || '';
    }

    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    const origin = getApiOrigin();
    return origin ? `${origin}${normalizedPath}` : normalizedPath;
  }

  global.ChordWikiRuntime = {
    DEFAULT_LOCAL_API_ORIGIN,
    appName: 'MyChordpro',
    isLocalPreview,
    getApiOrigin,
    buildApiUrl,
    /** セットリスト REST API は未提供のためクラウド同期を行わず localStorage のみ運用する */
    setlistsCloudSyncEnabled: false,
    /** 個人用アプリ: 「編集者ロール」を持たないため編集・セットリスト系 UI を常に許可する */
    alwaysEnableEditorUi: true
  };
})(window);
