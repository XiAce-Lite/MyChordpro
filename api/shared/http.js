function jsonResponse(status, body) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body
  };
}

function badRequest(detail = '') {
  const body = { error: 'BadRequest' };
  if (detail) {
    body.detail = detail;
  }
  return jsonResponse(400, body);
}

function unauthorized(detail = '') {
  const body = { error: 'Unauthorized' };
  if (detail) {
    body.detail = detail;
  }
  return jsonResponse(401, body);
}

function notFound(detail = '') {
  const body = { error: 'NotFound' };
  if (detail) {
    body.detail = detail;
  }
  return jsonResponse(404, body);
}

function conflict(detail = '') {
  const body = { error: 'Conflict' };
  if (detail) {
    body.detail = detail;
  }
  return jsonResponse(409, body);
}

function methodNotAllowed(detail = '') {
  const body = { error: 'MethodNotAllowed' };
  if (detail) {
    body.detail = detail;
  }
  return jsonResponse(405, body);
}

function serverConfigError(detail = 'Missing COSMOS_ENDPOINT or COSMOS_KEY.') {
  return jsonResponse(500, { error: 'ServerConfigError', detail });
}

function internalServerError(error) {
  return jsonResponse(500, {
    error: 'InternalServerError',
    detail: String(error?.message || error)
  });
}

module.exports = {
  jsonResponse,
  badRequest,
  unauthorized,
  notFound,
  conflict,
  methodNotAllowed,
  serverConfigError,
  internalServerError
};
