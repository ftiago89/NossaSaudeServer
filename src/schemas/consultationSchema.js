const {
  MEDICATION_FORMS,
  EFFICACY_VALUES,
  UPLOAD_TYPES,
  UPLOAD_TYPE_VALUES,
} = require('../utils/enums');

const medicationItemSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
    activeIngredient: { type: 'string' },
    dosage: { type: 'string' },
    form: { type: 'string', enum: MEDICATION_FORMS },
    frequency: { type: 'string' },
    contraindicated: { type: 'boolean' },
    restrictionReason: { type: 'string' },
    efficacy: { type: ['string', 'null'], enum: [...EFFICACY_VALUES, null] },
    sideEffects: { type: 'string' },
  },
  additionalProperties: false,
  if: { properties: { contraindicated: { const: true } }, required: ['contraindicated'] },
  then: { required: ['restrictionReason'] },
};

const examItemSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    _id: { type: 'string' },
    name: { type: 'string', minLength: 1 },
    notes: { type: 'string' },
  },
  additionalProperties: false,
};

const doctorSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    specialty: { type: 'string' },
    customSpecialty: { type: 'string' },
  },
  additionalProperties: false,
};

const consultationProperties = {
  memberId: { type: 'string', minLength: 1 },
  date: { type: 'string', format: 'date-time' },
  reason: { type: 'string', minLength: 1 },
  doctor: doctorSchema,
  clinic: { type: 'string' },
  notes: { type: 'string' },
  tags: { type: 'array', items: { type: 'string' } },
  returnOf: { type: 'string' },
  medications: { type: 'array', items: medicationItemSchema },
  exams: { type: 'array', items: examItemSchema },
};

const addImageProperties = {
  addPrescriptionImage: {
    type: 'object',
    required: ['s3Key'],
    properties: { s3Key: { type: 'string', minLength: 1 } },
    additionalProperties: false,
  },
  addExamImage: {
    type: 'object',
    required: ['examId', 's3Key'],
    properties: {
      examId: { type: 'string', minLength: 1 },
      s3Key: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
  removePrescriptionImage: {
    type: 'object',
    required: ['s3Key'],
    properties: { s3Key: { type: 'string', minLength: 1 } },
    additionalProperties: false,
  },
  removeExamImage: {
    type: 'object',
    required: ['examId', 's3Key'],
    properties: {
      examId: { type: 'string', minLength: 1 },
      s3Key: { type: 'string', minLength: 1 },
    },
    additionalProperties: false,
  },
};

const createConsultationSchema = {
  type: 'object',
  required: ['memberId', 'date', 'reason'],
  properties: consultationProperties,
  additionalProperties: false,
};

const updateConsultationSchema = {
  type: 'object',
  properties: { ...consultationProperties, ...addImageProperties },
  additionalProperties: false,
  minProperties: 1,
};

const uploadUrlSchema = {
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', enum: UPLOAD_TYPE_VALUES },
    contentType: { type: 'string' },
  },
  additionalProperties: false,
};

module.exports = {
  createConsultationSchema,
  updateConsultationSchema,
  uploadUrlSchema,
};
