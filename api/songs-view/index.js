const { getContainer } = require('../shared/cosmos');
const {
  jsonResponse,
  badRequest,
  unauthorized,
  notFound,
  serverConfigError,
  internalServerError
} = require('../shared/http');
const { getOwnerId } = getOwnerId(req);

const container = getContainer();

function normalizeScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.trunc(numeric));
}

module.exports = async function (context, req) {
  const ownerId = getOwnerId(req);

  if (!ownerId) {
    context.res = unauthorized();
    return;
  }

  if (!container) {
    context.res = serverConfigError();
    return;
  }

  const id = String(context.bindingData.id || req.query?.id || '').trim();
  if (!id) {
    context.res = badRequest();
    return;
  }

  try {
    const itemRef = container.item(id, ownerId);
    const { resource: song } = await itemRef.read();

    if (!song) {
      context.res = notFound();
      return;
    }

    const lastViewedAt = new Date().toISOString();
    const nextScore = Math.min(normalizeScore(song.score) + 1, 100);

    const updatedSong = {
      ...song,
      score: nextScore,
      last_viewed_at: lastViewedAt
    };

    await itemRef.replace(updatedSong);

    context.res = jsonResponse(200, {
      id: updatedSong.id,
      artist: updatedSong.artist,
      score: updatedSong.score,
      last_viewed_at: updatedSong.last_viewed_at
    });
  } catch (error) {
    if (error.code === 404) {
      context.res = notFound();
      return;
    }

    context.log.error('Failed to update song view score:', error);
    context.res = internalServerError(error);
  }
};
