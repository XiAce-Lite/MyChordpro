const { getContainer } = require('../shared/cosmos');
const {
  jsonResponse,
  unauthorized,
  serverConfigError,
  internalServerError
} = require('../shared/http');
const { getOwnerId } = require('../shared/auth');

const container = getContainer();

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

  try {
    const query = {
      query: 'SELECT c.id, c.artist, c.title, c.slug FROM c WHERE c.ownerId = @ownerId',
      parameters: [{ name: '@ownerId', value: ownerId }]
    };

    const { resources } = await container.items.query(query, {
      partitionKey: ownerId,
      maxItemCount: 100
    }).fetchAll();

    context.res = jsonResponse(200, resources);
  } catch (error) {
    context.log.error(error);
    context.res = internalServerError(error);
  }
};