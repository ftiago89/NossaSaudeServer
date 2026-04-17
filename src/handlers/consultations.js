const db = require('../database/db');
const Consultation = require('../models/Consultation');
const { withMiddleware } = require('../middleware/withMiddleware');
const { validateFamilyId } = require('../middleware/familyIdValidator');
const { validateBody } = require('../middleware/requestValidator');
const { createConsultationSchema, updateConsultationSchema } = require('../schemas/consultationSchema');
const { successResponse, notFoundError } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');
const { deleteObjects } = require('../utils/s3');

const create = withMiddleware(validateFamilyId, validateBody(createConsultationSchema))(
  async (event) => {
    await db();
    const consultation = await Consultation.create({
      ...event.validatedBody,
      familyId: event.familyId,
      syncedAt: new Date(),
    });
    return successResponse(statusCode.CREATED, consultation);
  }
);

const list = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const query = event.queryStringParameters || {};
  const filter = {
    familyId: event.familyId,
    deletedAt: null,
  };

  if (query.memberId) filter.memberId = query.memberId;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(query.from);
    if (query.to) filter.date.$lte = new Date(query.to);
  }
  if (query.doctor) filter['doctor.name'] = { $regex: query.doctor, $options: 'i' };
  if (query.tag) filter.tags = query.tag;

  const consultations = await Consultation.find(filter).sort({ date: -1 }).lean();
  return successResponse(statusCode.OK, consultations);
});

const getById = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const { id } = event.pathParameters;
  const consultation = await Consultation.findOne({
    _id: id,
    familyId: event.familyId,
    deletedAt: null,
  }).lean();
  if (!consultation) return notFoundError('Consultation');
  return successResponse(statusCode.OK, consultation);
});

const update = withMiddleware(validateFamilyId, validateBody(updateConsultationSchema))(
  async (event) => {
    await db();
    const { id } = event.pathParameters;
    const { addPrescriptionImage, addExamImage, removePrescriptionImage, removeExamImage, exams, ...fields } = event.validatedBody;

    const consultation = await Consultation.findOne({
      _id: id,
      familyId: event.familyId,
      deletedAt: null,
    });
    if (!consultation) return notFoundError('Consultation');

    if (exams !== undefined) {
      fields.exams = exams.map((incoming) => {
        const existing = incoming._id ? consultation.exams.id(incoming._id) : null;
        return { ...incoming, resultImages: existing ? existing.resultImages : [] };
      });
    }

    Object.assign(consultation, { ...fields, syncedAt: new Date() });

    if (addPrescriptionImage) {
      consultation.prescriptionImages.push({
        s3Key: addPrescriptionImage.s3Key,
        uploadedAt: new Date(),
      });
    }

    if (addExamImage) {
      const exam = consultation.exams.id(addExamImage.examId);
      if (!exam) return notFoundError('Exam');
      exam.resultImages.push({ s3Key: addExamImage.s3Key, uploadedAt: new Date() });
    }

    if (removePrescriptionImage) {
      consultation.prescriptionImages.pull({ s3Key: removePrescriptionImage.s3Key });
      await deleteObjects([removePrescriptionImage.s3Key]);
    }

    if (removeExamImage) {
      const exam = consultation.exams.id(removeExamImage.examId);
      if (!exam) return notFoundError('Exam');
      exam.resultImages.pull({ s3Key: removeExamImage.s3Key });
      await deleteObjects([removeExamImage.s3Key]);
    }

    await consultation.save();
    return successResponse(statusCode.OK, consultation);
  }
);

const remove = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const { id } = event.pathParameters;
  const consultation = await Consultation.findOneAndUpdate(
    { _id: id, familyId: event.familyId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: false }
  );
  if (!consultation) return notFoundError('Consultation');

  const s3Keys = [
    ...consultation.prescriptionImages.map((img) => img.s3Key),
    ...consultation.exams.flatMap((exam) => exam.resultImages.map((img) => img.s3Key)),
  ];
  await deleteObjects(s3Keys);

  return successResponse(statusCode.OK, { message: 'Consultation deleted' });
});

module.exports = { create, list, getById, update, remove };
