const { getContainer } = require('../shared/cosmos');
const {
  badRequest,
  notFound,
  internalServerError,
  jsonResponse
} = require('../shared/http');
const { resolveAuthorizedOwnerContext } = require('../shared/request-context');

const container = getContainer();

module.exports = async function (context, req) {
  const id = String(req.query?.id || context.bindingData.id || '').trim();

  if (!id) {
    context.res = badRequest('id is required.');
    return;
  }

  const requestContext = resolveAuthorizedOwnerContext(context, req, container);
  if (!requestContext) {
    return;
  }
  const { ownerId } = requestContext;

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