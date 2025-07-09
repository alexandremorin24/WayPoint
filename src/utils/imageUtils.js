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
    const image = sharp(buffer, { limitInputPixels: false });
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
 * Convert an image buffer to WebP or PNG and save to disk.
 * Uses PNG for images larger than WebP limits (16383x16383).
 * Only resizes if resizeOptions is provided (used for avatars/thumbnails).
 * For maps: do NOT resize (keep original size).
 * @param {Buffer} buffer
 * @param {string} outputPath
 * @param {Object} [resizeOptions] - Optional { width, height, fit, position }
 */
async function convertToWebP(buffer, outputPath, resizeOptions) {
  try {
    // Get image metadata to check dimensions
    const metadata = await sharp(buffer, { limitInputPixels: false }).metadata();
    const { width, height } = metadata;

    // WebP maximum dimensions are 16383x16383
    const webpMaxDimension = 16383;
    const useWebP = width <= webpMaxDimension && height <= webpMaxDimension;

    let sharpInstance = sharp(buffer, { limitInputPixels: false });
    if (resizeOptions) {
      sharpInstance = sharpInstance.resize(resizeOptions);
    }

    if (useWebP) {
      await sharpInstance
        .webp({ quality: 80 })
        .toFile(outputPath);
    } else {
      // Update file extension to .png
      const pngPath = outputPath.replace(/\.webp$/, '.png');
      await sharpInstance
        .png({ quality: 80, compressionLevel: 6 })
        .toFile(pngPath);
    }
  } catch (err) {
    console.error('Error in convertToWebP:', err);
    throw new Error(`Error during image conversion: ${err.message}`);
  }
}

/**
 * Generate a thumbnail (WebP or PNG, 300px width) from an image buffer and save to disk.
 * Uses PNG for very large source images, WebP for normal sizes.
 * @param {Buffer} buffer
 * @param {string} outputPath
 */
async function generateThumbnail(buffer, outputPath) {
  try {
    // Get source image metadata
    const metadata = await sharp(buffer, { limitInputPixels: false }).metadata();
    const { width, height } = metadata;

    // For thumbnails, always use WebP since we resize to 300x300
    // Only use PNG if the source is extremely large and might cause processing issues
    const webpMaxDimension = 16383;
    const useWebP = width <= webpMaxDimension && height <= webpMaxDimension;

    const size = 300;

    let sharpInstance = sharp(buffer, { limitInputPixels: false })
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      });

    if (useWebP) {
      await sharpInstance
        .webp({ quality: 80 })
        .toFile(outputPath);
    } else {
      const pngPath = outputPath.replace(/\.webp$/, '.png');
      await sharpInstance
        .png({ quality: 80, compressionLevel: 6 })
        .toFile(pngPath);
    }
  } catch (err) {
    console.error('Error in generateThumbnail:', err);
    throw new Error(`Error during thumbnail generation: ${err.message}`);
  }
}

/**
 * Determine the optimal format based on image dimensions
 * @param {Buffer} buffer
 * @returns {Promise<{useWebP: boolean, extension: string}>}
 */
async function getOptimalFormat(buffer) {
  const metadata = await sharp(buffer, { limitInputPixels: false }).metadata();
  const { width, height } = metadata;
  const webpMaxDimension = 16383;
  const useWebP = width <= webpMaxDimension && height <= webpMaxDimension;

  return {
    useWebP,
    extension: useWebP ? '.webp' : '.png',
    width,
    height
  };
}

module.exports = {
  validateImageBuffer,
  convertToWebP,
  generateThumbnail,
  getOptimalFormat
}; 
