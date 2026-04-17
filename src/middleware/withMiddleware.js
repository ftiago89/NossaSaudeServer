const { errorResponse } = require('../utils/requestsRespose');

/**
 * Composes a list of middlewares into a handler wrapper.
 *
 * Each middleware receives (event, context) and should return:
 *   - null / undefined  → continue to the next middleware or handler
 *   - a response object → short-circuit and return immediately
 *
 * Any error thrown by a middleware or the handler is converted to an
 * error response via errorResponse().
 */
function withMiddleware(...middlewares) {
  return function (handler) {
    return async function (event, context) {
      try {
        for (const middleware of middlewares) {
          const response = await middleware(event, context);
          if (response) return response;
        }
        return await handler(event, context);
      } catch (err) {
        console.error('handler error:', err);
        return errorResponse(err);
      }
    };
  };
}

module.exports = { withMiddleware };
