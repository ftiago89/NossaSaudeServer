const { randomUUID } = require('crypto');
const db = require('../database/db');
const Consultation = require('../models/Consultation');
const { withMiddleware } = require('../middleware/withMiddleware');
const { validateFamilyId } = require('../middleware/familyIdValidator');
const { validateBody } = require('../middleware/requestValidator');
const { uploadUrlSchema } = require('../schemas/consultationSchema');
const { generateUploadUrl, generateReadUrl } = require('../utils/s3');
const { successResponse, notFoundError } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');
const { UPLOAD_TYPES } = require('../utils/enums');

const createUploadUrl = withMiddleware(
  validateFamilyId,
  validateBody(uploadUrlSchema)
)(async (event) => {
  await db();
  const { id } = event.pathParameters;
  const { type, contentType = 'image/jpeg' } = event.validatedBody;

  const consultation = await Consultation.findOne({
    _id: id,
    familyId: event.familyId,
    deletedAt: null,
  }).lean();
  if (!consultation) return notFoundError('Consultation');

  const fileId = randomUUID();
  const folder = type === UPLOAD_TYPES.EXAM ? 'exams' : 'prescriptions';
  const s3Key = `${event.familyId}/${consultation.memberId}/consultation/${id}/${folder}/${fileId}.jpg`;

  const uploadUrl = await generateUploadUrl(s3Key, contentType);

  return successResponse(statusCode.OK, { uploadUrl, s3Key });
});

const listImages = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const { id } = event.pathParameters;

  const consultation = await Consultation.findOne({
    _id: id,
    familyId: event.familyId,
    deletedAt: null,
  }).lean();
  if (!consultation) return notFoundError('Consultation');

  const prescriptions = await Promise.all(
    consultation.prescriptionImages.map(async (img) => ({
      s3Key: img.s3Key,
      url: await generateReadUrl(img.s3Key),
      uploadedAt: img.uploadedAt,
    }))
  );

  const exams = await Promise.all(
    consultation.exams.map(async (exam) => ({
      examId: exam._id,
      examName: exam.name,
      images: await Promise.all(
        exam.resultImages.map(async (img) => ({
          s3Key: img.s3Key,
          url: await generateReadUrl(img.s3Key),
          uploadedAt: img.uploadedAt,
        }))
      ),
    }))
  );

  return successResponse(statusCode.OK, { prescriptions, exams });
});

module.exports = { createUploadUrl, listImages };
