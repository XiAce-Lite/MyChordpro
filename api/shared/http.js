function jsonResponse(status, body) {
  return {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body
  };
}

function badRequest() {
  return jsonResponse(400, { error: 'BadRequest' });
}

function unauthorized() {
  return jsonResponse(401, { error: 'Unauthorized' });
}

function notFound() {
  return jsonResponse(404, { error: 'NotFound' });
}

function conflict() {
  return jsonResponse(409, { error: 'Conflict' });
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
  serverConfigError,
  internalServerError
};
