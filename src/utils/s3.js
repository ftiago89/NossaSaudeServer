const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// When S3_ENDPOINT is set (local dev with LocalStack), use path-style
// addressing and fake credentials — otherwise use standard AWS config.
const clientConfig = {
  region: process.env.AWS_REGION || 'sa-east-1',
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
};

if (process.env.S3_ENDPOINT) {
  clientConfig.endpoint = process.env.S3_ENDPOINT;
  clientConfig.forcePathStyle = true;
  clientConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  };
}

const s3Client = new S3Client(clientConfig);
const BUCKET = process.env.S3_BUCKET;

/**
 * Generates a presigned PUT URL for direct upload to S3.
 * @param {string} key - S3 object key (path)
 * @param {string} contentType - MIME type (e.g. 'image/jpeg')
 * @param {number} expiresIn - seconds until expiry (default 300 = 5 min)
 */
async function generateUploadUrl(key, contentType = 'image/jpeg', expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generates a presigned GET URL for reading an S3 object.
 * @param {string} key - S3 object key (path)
 * @param {number} expiresIn - seconds until expiry (default 900 = 15 min)
 */
async function generateReadUrl(key, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Deletes multiple S3 objects in a single request.
 * @param {string[]} keys - Array of S3 object keys to delete
 */
async function deleteObjects(keys) {
  if (!keys || keys.length === 0) return;
  const command = new DeleteObjectsCommand({
    Bucket: BUCKET,
    Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
  });
  await s3Client.send(command);
}

module.exports = { generateUploadUrl, generateReadUrl, deleteObjects };
