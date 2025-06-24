const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const imageUtils = require('../../src/utils/imageUtils');

const testFilesDir = path.join(__dirname, 'generated');
const outputWebP = path.join(testFilesDir, 'output-test.webp');
const outputThumb = path.join(testFilesDir, 'output-thumb.webp');

beforeAll(() => {
  if (!fs.existsSync(testFilesDir)) fs.mkdirSync(testFilesDir);
});

afterAll(() => {
  // Clean up all generated files and directory
  [outputWebP, outputThumb].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  if (fs.existsSync(testFilesDir)) fs.rmdirSync(testFilesDir);
});

describe('imageUtils', () => {
  let validBuffer;
  let largeBuffer;
  let invalidBuffer;

  beforeEach(async () => {
    // Generate a valid 300x300 RGBA image buffer
    validBuffer = await sharp({ create: { width: 300, height: 300, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
      .png()
      .toBuffer();
    // Generate a too large 600x600 RGBA image buffer
    largeBuffer = await sharp({ create: { width: 600, height: 600, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
      .png()
      .toBuffer();
    // Generate a fake buffer (not an image)
    invalidBuffer = Buffer.from('not an image');
  });

  it('should validate a valid image buffer', async () => {
    await expect(imageUtils.validateImageBuffer(validBuffer)).resolves.toBeUndefined();
  });

  it('should throw on non-image file', async () => {
    await expect(imageUtils.validateImageBuffer(invalidBuffer)).rejects.toThrow('Invalid image file');
  });

  it('should throw on too large image', async () => {
    await expect(imageUtils.validateImageBuffer(largeBuffer)).rejects.toThrow('Image is too large');
  });

  it('should convert to WebP', async () => {
    await imageUtils.convertToWebP(validBuffer, outputWebP);
    expect(fs.existsSync(outputWebP)).toBe(true);
    // Check that the file is a WebP
    const meta = await sharp(outputWebP).metadata();
    expect(meta.format).toBe('webp');
  });

  it('should generate a thumbnail (300px width)', async () => {
    await imageUtils.generateThumbnail(validBuffer, outputThumb);
    expect(fs.existsSync(outputThumb)).toBe(true);
    const meta = await sharp(outputThumb).metadata();
    expect(meta.width).toBeLessThanOrEqual(300);
    expect(meta.format).toBe('webp');
  });
}); 
