const path = require('path');
const fs = require('fs');

/**
 * Gets the path to a test image file
 * @param {string} name - Name of the test image to use
 * @returns {string} - Path to the test image file
 */
function getTestImagePath(name) {
  const imagePath = path.join(__dirname, '../fixtures/images', `${name}.png`);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Test image ${name}.png not found in fixtures/images directory`);
  }

  return imagePath;
}

module.exports = {
  getTestImagePath
}; 
