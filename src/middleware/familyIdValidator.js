const { errorResponse } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');
const GeneralError = require('../errors/GeneralError');

/**
 * Validates the X-Family-Id header (API Gateway normalizes headers to lowercase).
 * On success, injects event.familyId for downstream handlers.
 */
async function validateFamilyId(event) {
  const headers = event.headers || {};
  const headersLower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const familyId = headersLower['x-family-id'];

  if (!familyId || typeof familyId !== 'string' || familyId.trim() === '') {
    return errorResponse(
      new GeneralError(statusCode.BAD_REQUEST, {
        code: 'MISSING_FAMILY_ID',
        message: 'X-Family-Id header is required',
      })
    );
  }

  event.familyId = familyId.trim();
  return null;
}

module.exports = { validateFamilyId };
