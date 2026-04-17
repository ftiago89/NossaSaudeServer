const { BLOOD_TYPES } = require('../utils/enums');

const memberProperties = {
  name: { type: 'string', minLength: 1 },
  birthDate: { type: 'string', format: 'date-time' },
  bloodType: { type: 'string', enum: BLOOD_TYPES },
  weight: { type: 'number', minimum: 0 },
  height: { type: 'number', minimum: 0 },
  allergies: { type: 'array', items: { type: 'string' } },
  chronicConditions: { type: 'array', items: { type: 'string' } },
};

const createMemberSchema = {
  type: 'object',
  required: ['name'],
  properties: memberProperties,
  additionalProperties: false,
};

const updateMemberSchema = {
  type: 'object',
  properties: memberProperties,
  additionalProperties: false,
  minProperties: 1,
};

module.exports = { createMemberSchema, updateMemberSchema };
