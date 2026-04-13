const { getContainer } = require('../shared/cosmos');
const {
  jsonResponse,
  internalServerError
} = require('../shared/http');
const { resolveAuthorizedOwnerContext } = require('../shared/request-context');

const container = getContainer();

module.exports = async function (context, req) {
  const requestContext = resolveAuthorizedOwnerContext(context, req, container);
  if (!requestContext) {
    return;
  }
  const { ownerId } = requestContext;

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