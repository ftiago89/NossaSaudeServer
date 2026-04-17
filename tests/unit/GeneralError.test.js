const GeneralError = require('../../src/errors/GeneralError');

test('sets status, statusDescription, error and type', () => {
  const err = new GeneralError(404, { code: 'NOT_FOUND', message: 'not found' });

  expect(err.status).toBe(404);
  expect(err.statusDescription).toBe('Not Found');
  expect(err.error).toEqual({ code: 'NOT_FOUND', message: 'not found' });
  expect(err.type).toBe('General Error');
});

test('sets errors array when provided', () => {
  const errors = [{ field: 'name', message: 'required' }];
  const err = new GeneralError(422, { code: 'VALIDATION_ERROR' }, errors);

  expect(err.errors).toBe(errors);
});

test('errors is undefined when not provided', () => {
  const err = new GeneralError(400, { code: 'BAD_REQUEST' });

  expect(err.errors).toBeUndefined();
});

test('sets a timestamp', () => {
  const before = new Date();
  const err = new GeneralError(500, {});
  const after = new Date();

  expect(err.timestamp).toBeInstanceOf(Date);
  expect(err.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
  expect(err.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
});
