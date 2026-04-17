const { buildEvent, buildEventWithoutFamilyId } = require('../helpers/eventBuilder');

jest.mock('../../src/database/db', () => jest.fn().mockResolvedValue());
jest.mock('../../src/utils/s3', () => ({
  generateUploadUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-put-url'),
  generateReadUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-get-url'),
}));

const mockConsultation = {
  _id: 'uuid-consult-1',
  familyId: 'family-test-001',
  memberId: 'uuid-member-1',
  prescriptionImages: [{ s3Key: 'family/member/consult/prescriptions/img1.jpg', uploadedAt: new Date() }],
  exams: [
    {
      _id: 'uuid-exam-1',
      name: 'Hemograma',
      resultImages: [{ s3Key: 'family/member/consult/exams/img1.jpg', uploadedAt: new Date() }],
    },
  ],
  deletedAt: null,
};

jest.mock('../../src/models/Consultation', () => ({
  findOne: jest.fn(),
}));

const Consultation = require('../../src/models/Consultation');
const { generateUploadUrl: mockGenerateUploadUrl } = require('../../src/utils/s3');
const { createUploadUrl, listImages } = require('../../src/handlers/prescriptions');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Prescriptions — success flows', () => {
  test('createUploadUrl returns uploadUrl and s3Key without saving to the database', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockConsultation) });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { type: 'prescription' },
    });
    const res = await createUploadUrl(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.uploadUrl).toBe('https://s3.example.com/presigned-put-url');
    expect(typeof body.s3Key).toBe('string');
    expect(body.s3Key).toMatch(/consultation\/uuid-consult-1\/prescriptions\//);
    expect(body.s3Key).toContain('prescriptions/');
    expect(mockGenerateUploadUrl).toHaveBeenCalledTimes(1);
  });

  test('createUploadUrl for exam type generates s3Key under exams/ folder', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockConsultation) });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { type: 'exam' },
    });
    const res = await createUploadUrl(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.s3Key).toMatch(/consultation\/uuid-consult-1\/exams\//);
    expect(body.s3Key).toContain('exams/');
  });

  test('listImages returns presigned GET URLs grouped by prescriptions and exams', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockConsultation) });

    const event = buildEvent({ pathParameters: { id: 'uuid-consult-1' } });
    const res = await listImages(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.prescriptions).toHaveLength(1);
    expect(body.prescriptions[0].url).toBe('https://s3.example.com/presigned-get-url');
    expect(body.prescriptions[0].s3Key).toBe('family/member/consult/prescriptions/img1.jpg');
    expect(body.exams).toHaveLength(1);
    expect(body.exams[0].examName).toBe('Hemograma');
    expect(body.exams[0].images).toHaveLength(1);
    expect(body.exams[0].images[0].url).toBe('https://s3.example.com/presigned-get-url');
  });
});

describe('Prescriptions — error flows', () => {
  test('createUploadUrl without X-Family-Id returns 400', async () => {
    const event = buildEventWithoutFamilyId({
      pathParameters: { id: 'uuid-consult-1' },
      body: { type: 'prescription' },
    });
    const res = await createUploadUrl(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(400);
    expect(body.errorCode).toBe('MISSING_FAMILY_ID');
  });

  test('createUploadUrl with invalid body (missing type) returns 422', async () => {
    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { contentType: 'image/jpeg' },
    });
    const res = await createUploadUrl(event, {});

    expect(res.statusCode).toBe(422);
  });

  test('createUploadUrl with non-existent consultation returns 404', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const event = buildEvent({
      pathParameters: { id: 'non-existent' },
      body: { type: 'prescription' },
    });
    const res = await createUploadUrl(event, {});

    expect(res.statusCode).toBe(404);
  });

  test('listImages with non-existent consultation returns 404', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const event = buildEvent({ pathParameters: { id: 'non-existent' } });
    const res = await listImages(event, {});

    expect(res.statusCode).toBe(404);
  });
});
