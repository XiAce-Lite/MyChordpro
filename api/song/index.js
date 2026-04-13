const { getContainer } = require('../shared/cosmos');
const {
  badRequest,
  unauthorized,
  notFound,
  serverConfigError,
  internalServerError,
  jsonResponse
} = require('../shared/http');
const { getOwnerId } = getOwnerId(req);

const container = getContainer();

module.exports = async function (context, req) {
  const id = String(req.query?.id || context.bindingData.id || '').trim();
  const ownerId = getOwnerId(req);

  if (!id) {
    context.res = badRequest();
    return;
  }

  if (!ownerId) {
    context.res = unauthorized();
    return;
  }

  if (!container) {
    context.res = serverConfigError();
    return;
  }

  try {
    const { resource: item } = await container.item(id, ownerId).read();

    if (!item) {
      context.res = notFound();
      return;
    }

    context.res = jsonResponse(200, item);
  } catch (error) {
    if (error.code === 404) {
      context.res = notFound();
      return;
    }

    context.log.error(error);
    context.res = internalServerError(error);
  }
};