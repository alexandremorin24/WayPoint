const sharp = require('sharp');
const fileType = require('file-type');

/**
 * Validate an image buffer for type and dimensions.
 * Throws an error if invalid.
 * @param {Buffer} buffer
 */
async function validateImageBuffer(buffer) {
  // Check file type using magic bytes
  const type = await fileType.fromBuffer(buffer);
  if (!type || !type.mime.startsWith('image/')) {
    throw new Error('Invalid image file.');
  }
  // Check dimensions
  const image = sharp(buffer);
  const metadata = await image.metadata();
  if (metadata.width < 100 || metadata.height < 100) {
    throw new Error('Image is too small (min 100x100).');
  }
  if (metadata.width > 10000 || metadata.height > 10000) {
    throw new Error('Image is too large (max 10000x10000).');
  }
}

/**
 * Convert an image buffer to WebP and save to disk.
 * @param {Buffer} buffer
 * @param {string} outputPath
 */
async function convertToWebP(buffer, outputPath) {
  await sharp(buffer).webp({ quality: 80 }).toFile(outputPath);
}

/**
 * Generate a thumbnail (WebP, 300px width) from an image buffer and save to disk.
 * @param {Buffer} buffer
 * @param {string} outputPath
 */
async function generateThumbnail(buffer, outputPath) {
  await sharp(buffer)
    .resize({ width: 300 })
    .webp({ quality: 80 })
    .toFile(outputPath);
}

module.exports = {
  validateImageBuffer,
  convertToWebP,
  generateThumbnail
}; 
