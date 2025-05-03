const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const imageUtils = require('../../src/utils/imageUtils');

describe('imageUtils', () => {
  const validImagePath = path.join(__dirname, 'test-image.png');
  const invalidImagePath = path.join(__dirname, 'not-an-image.txt');
  const smallImagePath = path.join(__dirname, 'small-image.png');
  const outputWebP = path.join(__dirname, 'output-test.webp');
  const outputThumb = path.join(__dirname, 'output-thumb.webp');

  afterAll(() => {
    // Cleanup generated files
    [outputWebP, outputThumb].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
  });

  it('should validate a valid image buffer', async () => {
    const buffer = fs.readFileSync(validImagePath);
    await expect(imageUtils.validateImageBuffer(buffer)).resolves.toBeUndefined();
  });

  it('should throw on non-image file', async () => {
    const buffer = fs.readFileSync(invalidImagePath);
    await expect(imageUtils.validateImageBuffer(buffer)).rejects.toThrow('Invalid image file');
  });

  it('should throw on too small image', async () => {
    const buffer = fs.readFileSync(smallImagePath);
    await expect(imageUtils.validateImageBuffer(buffer)).rejects.toThrow('Image is too small');
  });

  it('should convert to WebP', async () => {
    const buffer = fs.readFileSync(validImagePath);
    await imageUtils.convertToWebP(buffer, outputWebP);
    expect(fs.existsSync(outputWebP)).toBe(true);
    // Check that the file is a WebP
    const meta = await sharp(outputWebP).metadata();
    expect(meta.format).toBe('webp');
  });

  it('should generate a thumbnail (300px width)', async () => {
    const buffer = fs.readFileSync(validImagePath);
    await imageUtils.generateThumbnail(buffer, outputThumb);
    expect(fs.existsSync(outputThumb)).toBe(true);
    const meta = await sharp(outputThumb).metadata();
    expect(meta.width).toBeLessThanOrEqual(300);
    expect(meta.format).toBe('webp');
  });
}); 
