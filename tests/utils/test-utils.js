const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

/**
 * Gets the path to a test image file, and create it if it doesn't exist
 * @param {string} name - Name of the test image to use
 * @returns {string} - Path to the test image file
 */
async function getTestImagePath(name) {
  const fixturesDir = path.join(__dirname, '..', 'fixtures', 'images');
  const imagePath = path.join(fixturesDir, `${name}.png`);

  // Create directory if it doesn't exist
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Generate image if it doesn't exist
  if (!fs.existsSync(imagePath)) {
    await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .png()
      .toFile(imagePath);
  }

  return imagePath;
}

module.exports = {
  getTestImagePath
}; 
