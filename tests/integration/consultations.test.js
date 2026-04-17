const { buildEvent, buildEventWithoutFamilyId } = require('../helpers/eventBuilder');

jest.mock('../../src/database/db', () => jest.fn().mockResolvedValue());

const mockExam = {
  _id: 'uuid-exam-1',
  name: 'Hemograma Completo',
  notes: null,
  resultImages: [],
};

const mockConsultation = {
  _id: 'uuid-consult-1',
  familyId: 'family-test-001',
  memberId: 'uuid-member-1',
  date: new Date('2024-06-10'),
  reason: 'Dor de cabeça',
  doctor: { name: 'Dr. Carlos', specialty: 'NEUROLOGIA', customSpecialty: null },
  clinic: 'Clínica São Lucas',
  notes: null,
  tags: ['neurologia'],
  returnOf: null,
  prescriptionImages: [],
  medications: [
    {
      name: 'Amitriptilina',
      dosage: '25mg',
      form: 'COMPRIMIDO',
      contraindicated: false,
      efficacy: 'EFICAZ',
    },
  ],
  exams: [mockExam],
  syncedAt: new Date(),
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLean = jest.fn();
const mockSort = jest.fn(() => ({ lean: mockLean }));
const mockSave = jest.fn().mockResolvedValue();
const mockExamsId = jest.fn();

jest.mock('../../src/models/Consultation', () => ({
  create: jest.fn(),
  find: jest.fn(() => ({ sort: mockSort })),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../../src/utils/s3', () => ({
  generateUploadUrl: jest.fn(),
  generateReadUrl: jest.fn(),
  deleteObjects: jest.fn().mockResolvedValue(),
}));

const Consultation = require('../../src/models/Consultation');
const { deleteObjects } = require('../../src/utils/s3');
const { create, list, getById, update, remove } = require('../../src/handlers/consultations');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Consultations — success flows', () => {
  test('create returns 201 with the created consultation including medications and exams', async () => {
    Consultation.create.mockResolvedValue(mockConsultation);

    const event = buildEvent({
      body: {
        memberId: 'uuid-member-1',
        date: '2024-06-10T10:00:00.000Z',
        reason: 'Dor de cabeça',
        medications: [{ name: 'Amitriptilina', contraindicated: false }],
        exams: [{ name: 'Hemograma Completo' }],
      },
    });
    const res = await create(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(body.reason).toBe('Dor de cabeça');
    expect(body.medications).toHaveLength(1);
    expect(body.exams).toHaveLength(1);
    expect(Consultation.create).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: 'family-test-001', memberId: 'uuid-member-1' })
    );
  });

  test('list returns 200 with array of consultations', async () => {
    mockLean.mockResolvedValue([mockConsultation]);

    const event = buildEvent();
    const res = await list(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(Consultation.find).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: 'family-test-001', deletedAt: null })
    );
  });

  test('list with memberId filter passes filter to query', async () => {
    mockLean.mockResolvedValue([mockConsultation]);

    const event = buildEvent({ queryStringParameters: { memberId: 'uuid-member-1' } });
    await list(event, {});

    expect(Consultation.find).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: 'uuid-member-1' })
    );
  });

  test('list with date range filter passes $gte and $lte', async () => {
    mockLean.mockResolvedValue([]);

    const event = buildEvent({
      queryStringParameters: {
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.000Z',
      },
    });
    await list(event, {});

    expect(Consultation.find).toHaveBeenCalledWith(
      expect.objectContaining({
        date: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }),
      })
    );
  });

  test('list with tag filter passes tag to query', async () => {
    mockLean.mockResolvedValue([]);

    const event = buildEvent({ queryStringParameters: { tag: 'neurologia' } });
    await list(event, {});

    expect(Consultation.find).toHaveBeenCalledWith(
      expect.objectContaining({ tags: 'neurologia' })
    );
  });

  test('getById returns 200 with full consultation', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockConsultation) });

    const event = buildEvent({ pathParameters: { id: 'uuid-consult-1' } });
    const res = await getById(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body._id).toBe('uuid-consult-1');
    expect(body.medications).toHaveLength(1);
    expect(body.exams).toHaveLength(1);
  });

  test('update general fields returns 200 with updated consultation', async () => {
    const updated = { ...mockConsultation, notes: 'Paciente melhorou' };
    Consultation.findOne.mockResolvedValue({
      ...updated,
      exams: { id: mockExamsId },
      prescriptionImages: [],
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { notes: 'Paciente melhorou' },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(200);
    expect(mockSave).toHaveBeenCalled();
  });

  test('update with addPrescriptionImage saves s3Key to prescriptionImages', async () => {
    const prescriptionImages = [];
    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages,
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { addPrescriptionImage: { s3Key: 'family/member/consult/prescriptions/uuid.jpg' } },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(200);
    expect(prescriptionImages).toHaveLength(1);
    expect(prescriptionImages[0].s3Key).toBe('family/member/consult/prescriptions/uuid.jpg');
    expect(mockSave).toHaveBeenCalled();
  });

  test('update with addExamImage saves s3Key to the correct exam', async () => {
    const resultImages = [];
    const exam = { ...mockExam, resultImages };
    mockExamsId.mockReturnValue(exam);

    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages: [],
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: {
        addExamImage: { examId: 'uuid-exam-1', s3Key: 'family/member/consult/exams/uuid.jpg' },
      },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(200);
    expect(resultImages).toHaveLength(1);
    expect(resultImages[0].s3Key).toBe('family/member/consult/exams/uuid.jpg');
    expect(mockSave).toHaveBeenCalled();
  });

  test('update with removePrescriptionImage removes s3Key and deletes from S3', async () => {
    const mockPull = jest.fn();
    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages: { pull: mockPull },
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { removePrescriptionImage: { s3Key: 'family/member/consult/prescriptions/img1.jpg' } },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(200);
    expect(mockPull).toHaveBeenCalledWith({ s3Key: 'family/member/consult/prescriptions/img1.jpg' });
    expect(deleteObjects).toHaveBeenCalledWith(['family/member/consult/prescriptions/img1.jpg']);
    expect(mockSave).toHaveBeenCalled();
  });

  test('update with removeExamImage removes s3Key and deletes from S3', async () => {
    const mockPull = jest.fn();
    const exam = { ...mockExam, resultImages: { pull: mockPull } };
    mockExamsId.mockReturnValue(exam);

    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages: [],
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { removeExamImage: { examId: 'uuid-exam-1', s3Key: 'family/member/consult/exams/img1.jpg' } },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(200);
    expect(mockPull).toHaveBeenCalledWith({ s3Key: 'family/member/consult/exams/img1.jpg' });
    expect(deleteObjects).toHaveBeenCalledWith(['family/member/consult/exams/img1.jpg']);
    expect(mockSave).toHaveBeenCalled();
  });

  test('update with exams array preserves resultImages of existing exams', async () => {
    const existingExam = {
      _id: 'uuid-exam-1',
      name: 'Hemograma',
      resultImages: [{ s3Key: 'family/member/consult/exams/img1.jpg', uploadedAt: new Date() }],
    };
    mockExamsId.mockReturnValue(existingExam);

    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages: [],
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: {
        exams: [{ _id: 'uuid-exam-1', name: 'Hemograma Completo', notes: 'resultado ok' }],
      },
    });
    const res = await update(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(mockExamsId).toHaveBeenCalledWith('uuid-exam-1');
    expect(body.exams[0].resultImages).toHaveLength(1);
    expect(body.exams[0].resultImages[0].s3Key).toBe('family/member/consult/exams/img1.jpg');
    expect(mockSave).toHaveBeenCalled();
  });

  test('update with new exam (no _id) starts with empty resultImages', async () => {
    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages: [],
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { exams: [{ name: 'Raio-X' }] },
    });
    const res = await update(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.exams[0].resultImages).toHaveLength(0);
    expect(mockSave).toHaveBeenCalled();
  });

  test('remove returns 200 with success message and deletes S3 images', async () => {
    const consultationWithImages = {
      ...mockConsultation,
      prescriptionImages: [{ s3Key: 'family/member/consult/prescriptions/img1.jpg', uploadedAt: new Date() }],
      exams: [
        {
          _id: 'uuid-exam-1',
          name: 'Hemograma',
          resultImages: [{ s3Key: 'family/member/consult/exams/img2.jpg', uploadedAt: new Date() }],
        },
      ],
    };
    Consultation.findOneAndUpdate.mockResolvedValue(consultationWithImages);

    const event = buildEvent({ pathParameters: { id: 'uuid-consult-1' } });
    const res = await remove(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.message).toBe('Consultation deleted');
    expect(deleteObjects).toHaveBeenCalledWith([
      'family/member/consult/prescriptions/img1.jpg',
      'family/member/consult/exams/img2.jpg',
    ]);
  });

  test('remove with no images does not call deleteObjects with keys', async () => {
    Consultation.findOneAndUpdate.mockResolvedValue(mockConsultation);

    const event = buildEvent({ pathParameters: { id: 'uuid-consult-1' } });
    const res = await remove(event, {});

    expect(res.statusCode).toBe(200);
    expect(deleteObjects).toHaveBeenCalledWith([]);
  });
});

describe('Consultations — error flows', () => {
  test('create without X-Family-Id returns 400', async () => {
    const event = buildEventWithoutFamilyId({
      body: { memberId: 'uuid-member-1', date: '2024-06-10T10:00:00.000Z', reason: 'Dor' },
    });
    const res = await create(event, {});
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(400);
    expect(body.errorCode).toBe('MISSING_FAMILY_ID');
  });

  test('create with missing required fields returns 422', async () => {
    const event = buildEvent({ body: { notes: 'sem memberId nem date' } });
    const res = await create(event, {});

    expect(res.statusCode).toBe(422);
  });

  test('create with contraindicated=true and no restrictionReason returns 422', async () => {
    const event = buildEvent({
      body: {
        memberId: 'uuid-member-1',
        date: '2024-06-10T10:00:00.000Z',
        reason: 'Dor',
        medications: [{ name: 'Dipirona', contraindicated: true }],
      },
    });
    const res = await create(event, {});

    expect(res.statusCode).toBe(422);
  });

  test('getById with non-existent id returns 404', async () => {
    Consultation.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const event = buildEvent({ pathParameters: { id: 'non-existent' } });
    const res = await getById(event, {});

    expect(res.statusCode).toBe(404);
  });

  test('update with non-existent id returns 404', async () => {
    Consultation.findOne.mockResolvedValue(null);

    const event = buildEvent({ pathParameters: { id: 'non-existent' }, body: { notes: 'x' } });
    const res = await update(event, {});

    expect(res.statusCode).toBe(404);
  });

  test('update addExamImage with non-existent examId returns 404', async () => {
    mockExamsId.mockReturnValue(null);
    Consultation.findOne.mockResolvedValue({
      ...mockConsultation,
      prescriptionImages: [],
      exams: { id: mockExamsId },
      save: mockSave,
    });

    const event = buildEvent({
      pathParameters: { id: 'uuid-consult-1' },
      body: { addExamImage: { examId: 'non-existent-exam', s3Key: 'some/key.jpg' } },
    });
    const res = await update(event, {});

    expect(res.statusCode).toBe(404);
  });

  test('remove with non-existent id returns 404', async () => {
    Consultation.findOneAndUpdate.mockResolvedValue(null);

    const event = buildEvent({ pathParameters: { id: 'non-existent' } });
    const res = await remove(event, {});

    expect(res.statusCode).toBe(404);
  });
});
