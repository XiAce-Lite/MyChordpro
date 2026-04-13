const { getContainer } = require('../shared/cosmos');
const {
  badRequest,
  unauthorized,
  notFound,
  conflict,
  serverConfigError,
  internalServerError,
  jsonResponse
} = require('../shared/http');
const { normalizeSongBody } = require('../shared/validation');
const { getOwnerId } = require('../shared/auth');

const container = getContainer();

async function handleCreate(context, req, ownerId) {
  const parsed = normalizeSongBody(req.body, { requireId: true });
  if (parsed.error) {
    context.res = badRequest();
    return;
  }

  const now = new Date().toISOString();
  const item = {
    ...parsed.value,
    ownerId,
    createdAt: now,
    updatedAt: now,
    score: 0,
    last_viewed_at: null
  };

  try {
    const { resource: existing } = await container.item(item.id, ownerId).read();
    if (existing) {
      context.res = conflict();
      return;
    }
  } catch (error) {
    if (error.code !== 404) {
      throw error;
    }
  }

  try {
    const { resource } = await container.items.create(item, { partitionKey: ownerId });
    context.res = { status: 201, body: resource };
  } catch (error) {
    if (error.code === 409) {
      context.res = conflict();
      return;
    }

    throw error;
  }
}

async function readExistingSong(originalId, ownerId) {
  try {
    const response = await container.item(originalId, ownerId).read();
    return response.resource || null;
  } catch (error) {
    if (error.code === 404) {
      return null;
    }

    throw error;
  }
}

async function handleUpdate(context, req, ownerId) {
  const originalId = String(req.query?.id || context.bindingData.id || '').trim();

  if (!originalId) {
    context.res = badRequest();
    return;
  }

  const parsed = normalizeSongBody(req.body, { fallbackId: originalId, requireId: false });
  if (parsed.error) {
    context.res = badRequest();
    return;
  }

  const nextItem = parsed.value;
  if (nextItem.id && nextItem.id !== originalId) {
    context.res = badRequest();
    return;
  }

  const existing = await readExistingSong(originalId, ownerId);
  if (!existing) {
    context.res = notFound();
    return;
  }

  const now = new Date().toISOString();
  const updatedItem = {
    ...existing,
    ...nextItem,
    id: originalId,
    ownerId,
    createdAt: existing.createdAt || nextItem.createdAt || now,
    updatedAt: now
  };

  const { resource } = await container.item(originalId, ownerId).replace(updatedItem);

  context.res = { status: 200, body: resource };
}

async function handleDelete(context, req, ownerId) {
  const originalId = String(req.query?.id || context.bindingData.id || '').trim();

  if (!originalId) {
    context.res = badRequest();
    return;
  }

  const existing = await readExistingSong(originalId, ownerId);
  if (!existing) {
    context.res = notFound();
    return;
  }

  await container.item(originalId, ownerId).delete();
  context.res = {
    status: 200,
    body: { ok: true, id: originalId }
  };
}

module.exports = async function (context, req) {
  try {
    if (!container) {
      context.res = serverConfigError('Missing COSMOS_ENDPOINT or COSMOS_KEY');
      return;
    }

    const ownerId = getOwnerId(req);
    if (!ownerId) {
      context.res = unauthorized();
      return;
    }

    const method = String(req.method || '').toUpperCase();

    if (method === 'POST') {
      await handleCreate(context, req, ownerId);
      return;
    }

    if (method === 'PUT') {
      await handleUpdate(context, req, ownerId);
      return;
    }

    if (method === 'DELETE') {
      await handleDelete(context, req, ownerId);
      return;
    }

    context.res = jsonResponse(405, { error: 'MethodNotAllowed', detail: `Unsupported method: ${method}` });
  } catch (error) {
    context.log.error(error);
    context.res = internalServerError(error);
  }
};