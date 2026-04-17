const { buildEvent, buildEventWithoutFamilyId } = require('../helpers/eventBuilder');

jest.mock('../../src/database/db', () => jest.fn().mockResolvedValue());

const mockMember = {
  _id: 'uuid-member-1',
  familyId: 'family-test-001',
  name: 'João Silva',
  birthDate: new Date('1985-03-15'),
  bloodType: 'O+',
  weight: 80.5,
  height: 178,
  allergies: ['dipirona'],
  chronicConditions: [],
  syncedAt: new Date(),
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLean = jest.fn();
const mockSort = jest.fn(() => ({ lean: mockLean }));

jest.mock('../../src/models/Member', () => ({
  create: jest.fn(),
  find: jest.fn(() => ({ sort: mockSort })),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

const Member = require('../../src/models/Member');
const { create, list, getById, update, remove } = require('../../src/handlers/members');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Members — success flows', () => {
  test('create returns 201 with the created member', async () => {
    Member.create.mockResolvedValue(mockMember);

    const event = buildEvent({ body: { name: 'João Silva', bloodType: 'O+', weight: 80.5 } });
    const res = await create(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(body.name).toBe('João Silva');
    expect(Member.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João Silva', familyId: 'family-test-001' })
    );
  });

  test('list returns 200 with array of members', async () => {
    mockLean.mockResolvedValue([mockMember]);

    const event = buildEvent();
    const res = await list(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].name).toBe('João Silva');
    expect(Member.find).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: 'family-test-001', deletedAt: null })
    );
  });

  test('getById returns 200 with the member', async () => {
    Member.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockMember) });

    const event = buildEvent({ pathParameters: { id: 'uuid-member-1' } });
    const res = await getById(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body._id).toBe('uuid-member-1');
    expect(Member.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'uuid-member-1', familyId: 'family-test-001', deletedAt: null })
    );
  });

  test('update returns 200 with the updated member', async () => {
    const updated = { ...mockMember, weight: 82 };
    Member.findOneAndUpdate.mockResolvedValue(updated);

    const event = buildEvent({
      pathParameters: { id: 'uuid-member-1' },
      body: { weight: 82 },
    });
    const res = await update(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.weight).toBe(82);
  });

  test('remove returns 200 with success message', async () => {
    Member.findOneAndUpdate.mockResolvedValue({ ...mockMember, deletedAt: new Date() });

    const event = buildEvent({ pathParameters: { id: 'uuid-member-1' } });
    const res = await remove(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.message).toBe('Member deleted');
    expect(Member.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'uuid-member-1', deletedAt: null }),
      expect.objectContaining({ $set: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
      expect.any(Object)
    );
  });
});

describe('Members — error flows', () => {
  test('create without X-Family-Id returns 400', async () => {
    const event = buildEventWithoutFamilyId({ body: { name: 'João' } });
    const res = await create(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(400);
    expect(body.errorCode).toBe('MISSING_FAMILY_ID');
  });

  test('create with missing required field returns 422', async () => {
    const event = buildEvent({ body: { bloodType: 'O+' } });
    const res = await create(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(422);
    expect(body.errorCode).toBe('VALIDATION_ERROR');
  });

  test('create with invalid bloodType enum returns 422', async () => {
    const event = buildEvent({ body: { name: 'João', bloodType: 'X+' } });
    const res = await create(event, {});

    expect(res.statusCode).toBe(422);
  });

  test('getById with non-existent id returns 404', async () => {
    Member.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const event = buildEvent({ pathParameters: { id: 'non-existent' } });
    const res = await getById(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(404);
    expect(body.errorMessage).toBe('Member not found');
  });

  test('update with non-existent id returns 404', async () => {
    Member.findOneAndUpdate.mockResolvedValue(null);

    const event = buildEvent({ pathParameters: { id: 'non-existent' }, body: { weight: 80 } });
    const res = await update(event, {});

    expect(res.statusCode).toBe(404);
  });

  test('update with invalid body returns 422', async () => {
    const event = buildEvent({
      pathParameters: { id: 'uuid-member-1' },
      body: { bloodType: 'INVALID' },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(422);
  });

  test('remove with non-existent id returns 404', async () => {
    Member.findOneAndUpdate.mockResolvedValue(null);

    const event = buildEvent({ pathParameters: { id: 'non-existent' } });
    const res = await remove(event, {});

    expect(res.statusCode).toBe(404);
  });
});
