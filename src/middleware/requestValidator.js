const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { errorResponse } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');
const GeneralError = require('../errors/GeneralError');

// Single AJV instance reused across Lambda warm invocations
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Middleware factory. Returns a middleware that validates event.body
 * against the given JSON Schema.
 *
 * On success, injects event.validatedBody with the parsed body.
 */
function validateBody(schema) {
  const validate = ajv.compile(schema);

  return async function (event) {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return errorResponse(
        new GeneralError(statusCode.BAD_REQUEST, {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        })
      );
    }

    const valid = validate(body);
    if (!valid) {
      return errorResponse(
        new GeneralError(
          statusCode.UNPROCESSABLE_ENTITY,
          {
            code: 'VALIDATION_ERROR',
            message: 'Request body validation failed',
          },
          validate.errors
        )
      );
    }

    event.validatedBody = body;
    return null;
  };
}

module.exports = { validateBody };
