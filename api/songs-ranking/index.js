const {
  MAX_PAGES,
  normalizePage,
  normalizePageSize,
  calculateTotalLimit
} = require('../shared/pagination');
const { getContainer } = require('../shared/cosmos');
const {
  jsonResponse,
  internalServerError
} = require('../shared/http');
const { resolveAuthorizedOwnerContext } = require('../shared/request-context');
const {
  rankAndLimitSongs,
  getPageWindow
} = require('../shared/song-catalog');

const container = getContainer();

module.exports = async function (context, req) {
  const requestContext = resolveAuthorizedOwnerContext(context, req, container);
  if (!requestContext) {
    return;
  }
  const { ownerId } = requestContext;

  const pageSize = normalizePageSize(req.query.pageSize);
  const totalLimit = calculateTotalLimit(pageSize);
  const page = normalizePage(req.query.page, MAX_PAGES);
  const now = Date.now();

  try {
    const query = {
      query: 'SELECT c.id, c.artist, c.title, c.slug, c.score, c.last_viewed_at, c.tags FROM c WHERE c.ownerId = @ownerId',
      parameters: [{ name: '@ownerId', value: ownerId }]
    };

    const { resources } = await container.items.query(query, {
      partitionKey: ownerId,
      maxItemCount: totalLimit
    }).fetchAll();

    const limitedRankedSongs = rankAndLimitSongs(resources, totalLimit, now);
    const songs = getPageWindow(limitedRankedSongs, page, pageSize);
    const totalSongs = limitedRankedSongs.length; // ranking対象総数（最大300件）

    context.res = jsonResponse(200, {
      page,
      pageSize,
      totalLimit: totalLimit,
      totalPages: MAX_PAGES,
      totalSongs,
      songs
    });
  } catch (error) {
    context.log.error('Failed to load ranking songs:', error);
    context.res = internalServerError(error);
  }
};
