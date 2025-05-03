const sharp = require('sharp');
const path = require('path');

// Create a simple 300x300 white PNG image
sharp({
  create: {
    width: 300,
    height: 300,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 }
  }
})
  .png()
  .toFile(path.join(__dirname, 'test-image.png'))
  .then(() => {
    console.log('Test image created successfully');
  })
  .catch(err => {
    console.error('Error creating test image:', err);
    process.exit(1);
  }); 
