function buildEvent({
  headers = {},
  pathParameters = null,
  queryStringParameters = null,
  body = null,
  familyId = 'family-test-001',
} = {}) {
  return {
    headers: {
      'x-family-id': familyId,
      ...headers,
    },
    pathParameters,
    queryStringParameters,
    body: body !== null ? JSON.stringify(body) : null,
  };
}

function buildEventWithoutFamilyId({ pathParameters = null, queryStringParameters = null, body = null } = {}) {
  return {
    headers: {},
    pathParameters,
    queryStringParameters,
    body: body !== null ? JSON.stringify(body) : null,
  };
}

module.exports = { buildEvent, buildEventWithoutFamilyId };
