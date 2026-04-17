const {
  successResponse,
  errorResponse,
  notFoundError,
  badRequestError,
} = require('../../src/utils/requestsRespose');
const GeneralError = require('../../src/errors/GeneralError');

// ── successResponse ──────────────────────────────────────────

test('successResponse serializes body to JSON', () => {
  const res = successResponse(200, { name: 'João' });

  expect(res.statusCode).toBe(200);
  expect(JSON.parse(res.body)).toEqual({ name: 'João' });
});

test('successResponse without body omits body field', () => {
  const res = successResponse(204);

  expect(res.statusCode).toBe(204);
  expect(res.body).toBeUndefined();
});

// ── errorResponse ────────────────────────────────────────────

test('errorResponse with GeneralError returns correct status and body', () => {
  const err = new GeneralError(404, { code: 'NOT_FOUND', message: 'Member not found' });
  const res = errorResponse(err);
  const body = JSON.parse(res.body);

  expect(res.statusCode).toBe(404);
  expect(body.status).toBe(404);
  expect(body.statusDescription).toBe('Not Found');
  expect(body.errorCode).toBe('NOT_FOUND');
  expect(body.errorMessage).toBe('Member not found');
});

test('errorResponse with plain Error returns 500', () => {
  const res = errorResponse(new Error('something broke'));
  const body = JSON.parse(res.body);

  expect(res.statusCode).toBe(500);
  expect(body.status).toBe(500);
  expect(body.errorMessage).toBe('something broke');
});

test('errorResponse with plain Error without message falls back to description', () => {
  const res = errorResponse({});
  const body = JSON.parse(res.body);

  expect(res.statusCode).toBe(500);
  expect(body.errorMessage).toBe('Internal Server Error');
});

// ── notFoundError ────────────────────────────────────────────

test('notFoundError returns 404 with resource name in message', () => {
  const res = notFoundError('Member');
  const body = JSON.parse(res.body);

  expect(res.statusCode).toBe(404);
  expect(body.errorMessage).toBe('Member not found');
});

// ── badRequestError ──────────────────────────────────────────

test('badRequestError returns 400 with code and message', () => {
  const res = badRequestError('MISSING_FIELD', 'name is required');
  const body = JSON.parse(res.body);

  expect(res.statusCode).toBe(400);
  expect(body.errorCode).toBe('MISSING_FIELD');
  expect(body.errorMessage).toBe('name is required');
});
