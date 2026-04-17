const db = require('../database/db');
const Member = require('../models/Member');
const { withMiddleware } = require('../middleware/withMiddleware');
const { validateFamilyId } = require('../middleware/familyIdValidator');
const { validateBody } = require('../middleware/requestValidator');
const { createMemberSchema, updateMemberSchema } = require('../schemas/memberSchema');
const { successResponse, notFoundError } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');

const create = withMiddleware(validateFamilyId, validateBody(createMemberSchema))(
  async (event) => {
    await db();
    const member = await Member.create({
      ...event.validatedBody,
      familyId: event.familyId,
      syncedAt: new Date(),
    });
    return successResponse(statusCode.CREATED, member);
  }
);

const list = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const members = await Member.find({
    familyId: event.familyId,
    deletedAt: null,
  })
    .sort({ name: 1 })
    .lean();
  return successResponse(statusCode.OK, members);
});

const getById = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const { id } = event.pathParameters;
  const member = await Member.findOne({
    _id: id,
    familyId: event.familyId,
    deletedAt: null,
  }).lean();
  if (!member) return notFoundError('Member');
  return successResponse(statusCode.OK, member);
});

const update = withMiddleware(validateFamilyId, validateBody(updateMemberSchema))(
  async (event) => {
    await db();
    const { id } = event.pathParameters;
    const member = await Member.findOneAndUpdate(
      { _id: id, familyId: event.familyId, deletedAt: null },
      { $set: { ...event.validatedBody, syncedAt: new Date() } },
      { new: true, runValidators: true }
    );
    if (!member) return notFoundError('Member');
    return successResponse(statusCode.OK, member);
  }
);

const remove = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const { id } = event.pathParameters;
  const member = await Member.findOneAndUpdate(
    { _id: id, familyId: event.familyId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!member) return notFoundError('Member');
  return successResponse(statusCode.OK, { message: 'Member deleted' });
});

module.exports = { create, list, getById, update, remove };
