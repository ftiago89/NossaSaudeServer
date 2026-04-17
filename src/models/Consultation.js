const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');
const { MEDICATION_FORMS, EFFICACY_VALUES } = require('../utils/enums');

const imageSchema = new Schema(
  {
    s3Key: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const examSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  name: { type: String, required: true, trim: true },
  notes: { type: String, default: null },
  resultImages: { type: [imageSchema], default: [] },
});

const medicationSchema = new Schema({
  name: { type: String, required: true, trim: true },
  activeIngredient: { type: String, default: null },
  dosage: { type: String, default: null },
  form: {
    type: String,
    enum: MEDICATION_FORMS,
    default: null,
  },
  frequency: { type: String, default: null },
  contraindicated: { type: Boolean, default: false },
  restrictionReason: { type: String, default: null },
  efficacy: {
    type: String,
    enum: [...EFFICACY_VALUES, null],
    default: null,
  },
  sideEffects: { type: String, default: null },
});

const doctorSchema = new Schema(
  {
    name: { type: String, default: null },
    specialty: { type: String, default: null },
    customSpecialty: { type: String, default: null },
  },
  { _id: false }
);

const consultationSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    familyId: {
      type: String,
      required: true,
    },
    memberId: {
      type: String,
      ref: 'Member',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    doctor: {
      type: doctorSchema,
      default: () => ({}),
    },
    clinic: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    returnOf: {
      type: String,
      ref: 'Consultation',
      default: null,
    },
    prescriptionImages: {
      type: [imageSchema],
      default: [],
    },
    medications: {
      type: [medicationSchema],
      default: [],
    },
    exams: {
      type: [examSchema],
      default: [],
    },
    syncedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

consultationSchema.index({ familyId: 1, memberId: 1, date: -1 });
consultationSchema.index({ familyId: 1, tags: 1 });
consultationSchema.index({ familyId: 1, updatedAt: -1 });

module.exports = model('Consultation', consultationSchema);
