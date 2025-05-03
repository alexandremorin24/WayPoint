const sharp = require('sharp');
const fileType = require('file-type');

/**
 * Validate an image buffer for type and dimensions.
 * Throws an error if invalid.
 * @param {Buffer} buffer
 * @param {Object} [options] - Optional dimension constraints
 * @param {number} [options.maxWidth=500]
 * @param {number} [options.maxHeight=500]
 * @param {number} [options.minWidth=100]
 * @param {number} [options.minHeight=100]
 */
async function validateImageBuffer(buffer, options = {}) {
  const {
    maxWidth = 500,
    maxHeight = 500,
    minWidth = 100,
    minHeight = 100
  } = options;
  try {
    // Check file type using magic bytes
    const type = await fileType.fromBuffer(buffer);
    if (!type || !type.mime.startsWith('image/')) {
      throw new Error('Invalid image file. Only JPG, PNG, GIF, WebP are allowed.');
    }

    // Check dimensions
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      throw new Error(`Image is too large (max ${maxWidth}x${maxHeight} pixels).`);
    }

    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(`Image is too small (min ${minWidth}x${minHeight} pixels).`);
    }
  } catch (err) {
    // Propagate only our specific errors
    if (
      err.message.includes('Invalid image file') ||
      err.message.includes('Image is too large') ||
      err.message.includes('Image is too small')
    ) {
      throw err;
    }
    throw new Error('Error during image validation.');
  }
}

/**
 * Convert an image buffer to WebP and save to disk.
 * Resizes to 300x300.
 * @param {Buffer} buffer
 * @param {string} outputPath
 */
async function convertToWebP(buffer, outputPath) {
  try {
    const size = 300;
    await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
  } catch (err) {
    throw new Error('Error during image conversion to WebP.');
  }
}

/**
 * Generate a thumbnail (WebP, 300px width) from an image buffer and save to disk.
 * @param {Buffer} buffer
 * @param {string} outputPath
 */
async function generateThumbnail(buffer, outputPath) {
  try {
    const size = 300;
    await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
  } catch (err) {
    throw new Error('Error during thumbnail generation.');
  }
}

module.exports = {
  validateImageBuffer,
  convertToWebP,
  generateThumbnail
}; 
