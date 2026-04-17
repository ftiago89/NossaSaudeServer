const { Schema, model } = require('mongoose');
const { randomUUID } = require('crypto');
const { BLOOD_TYPES } = require('../utils/enums');

const memberSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    familyId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    bloodType: {
      type: String,
      enum: BLOOD_TYPES,
      default: null,
    },
    weight: {
      type: Number,
      min: 0,
      default: null,
    },
    height: {
      type: Number,
      min: 0,
      default: null,
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicConditions: {
      type: [String],
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

memberSchema.index({ familyId: 1, updatedAt: -1 });

module.exports = model('Member', memberSchema);
