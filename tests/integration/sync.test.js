const { buildEvent, buildEventWithoutFamilyId } = require('../helpers/eventBuilder');

jest.mock('../../src/database/db', () => jest.fn().mockResolvedValue());

const mockMembers = [
  { _id: 'uuid-member-1', familyId: 'family-test-001', name: 'João', updatedAt: new Date() },
];
const mockConsultations = [
  { _id: 'uuid-consult-1', familyId: 'family-test-001', reason: 'Dor', updatedAt: new Date() },
];

const mockMemberLean = jest.fn();
const mockConsultationLean = jest.fn();

jest.mock('../../src/models/Member', () => ({
  find: jest.fn(() => ({ lean: mockMemberLean })),
}));

jest.mock('../../src/models/Consultation', () => ({
  find: jest.fn(() => ({ lean: mockConsultationLean })),
}));

const Member = require('../../src/models/Member');
const Consultation = require('../../src/models/Consultation');
const { pull } = require('../../src/handlers/sync');

beforeEach(() => {
  jest.clearAllMocks();
  mockMemberLean.mockResolvedValue(mockMembers);
  mockConsultationLean.mockResolvedValue(mockConsultations);
});

describe('Sync — success flows', () => {
  test('pull without since returns all records and a syncedAt timestamp', async () => {
    const event = buildEvent();
    const res = await pull(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.members).toHaveLength(1);
    expect(body.consultations).toHaveLength(1);
    expect(body.syncedAt).toBeDefined();
    expect(new Date(body.syncedAt)).toBeInstanceOf(Date);
  });

  test('pull with since filters by updatedAt greater than the given timestamp', async () => {
    const since = '2024-06-01T00:00:00.000Z';
    const event = buildEvent({ queryStringParameters: { since } });
    await pull(event, {});

    const expectedDate = new Date(since);
    expect(Member.find).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: 'family-test-001',
        updatedAt: { $gt: expectedDate },
      })
    );
    expect(Consultation.find).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: 'family-test-001',
        updatedAt: { $gt: expectedDate },
      })
    );
  });

  test('pull with since as unix ms parses correctly', async () => {
    const sinceMs = 1717200000000;
    const event = buildEvent({ queryStringParameters: { since: String(sinceMs) } });
    await pull(event, {});

    expect(Member.find).toHaveBeenCalledWith(
      expect.objectContaining({
        updatedAt: { $gt: new Date(sinceMs) },
      })
    );
  });

  test('pull includes deleted records (deletedAt set)', async () => {
    const deletedMember = { ...mockMembers[0], deletedAt: new Date() };
    mockMemberLean.mockResolvedValue([deletedMember]);

    const event = buildEvent();
    const res = await pull(event, {});
    const body = JSON.parse(res.body);

    expect(body.members[0].deletedAt).toBeDefined();
  });
});

describe('Sync — error flows', () => {
  test('pull without X-Family-Id returns 400', async () => {
    const event = buildEventWithoutFamilyId();
    const res = await pull(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(400);
    expect(body.errorCode).toBe('MISSING_FAMILY_ID');
  });

  test('pull with non-parseable since defaults to epoch without throwing', async () => {
    const event = buildEvent({ queryStringParameters: { since: 'not-a-date' } });
    const res = await pull(event, {});

    expect(res.statusCode).toBe(200);
  });
});
