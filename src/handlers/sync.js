const db = require('../database/db');
const Member = require('../models/Member');
const Consultation = require('../models/Consultation');
const { withMiddleware } = require('../middleware/withMiddleware');
const { validateFamilyId } = require('../middleware/familyIdValidator');
const { successResponse } = require('../utils/requestsRespose');
const { statusCode } = require('../utils/constants');

/**
 * GET /sync?since={timestamp}
 *
 * Returns all members and consultations modified after the given timestamp
 * for the authenticated family. Records with deletedAt set are included
 * so clients can propagate deletions to their local Room database.
 */
const pull = withMiddleware(validateFamilyId)(async (event) => {
  await db();
  const query = event.queryStringParameters || {};

  let sinceDate;
  if (query.since) {
    const parsed = Number(query.since);
    sinceDate = Number.isNaN(parsed) ? new Date(query.since) : new Date(parsed);
  } else {
    sinceDate = new Date(0);
  }

  const familyFilter = { familyId: event.familyId, updatedAt: { $gt: sinceDate } };
  const [members, consultations] = await Promise.all([
    Member.find(familyFilter).lean(),
    Consultation.find(familyFilter).lean(),
  ]);

  return successResponse(statusCode.OK, {
    members,
    consultations,
    syncedAt: new Date().toISOString(),
  });
});

module.exports = { pull };
