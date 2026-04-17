const { successResponse } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');

async function check() {
  return successResponse(statusCode.OK, { status: 'ok' });
}

module.exports = { check };
