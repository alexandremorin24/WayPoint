const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/utils/db');

// Config
const uploadsDir = path.join(__dirname, '../public/uploads');
const DRY_RUN = !process.argv.includes('--delete');

(async () => {
  try {
    // 1. Retrieve all image paths referenced in the database
    const [maps] = await db.execute('SELECT image_url, thumbnail_url FROM maps');
    const referenced = new Set();
    for (const map of maps) {
      if (map.image_url) referenced.add(path.normalize(map.image_url));
      if (map.thumbnail_url) referenced.add(path.normalize(map.thumbnail_url));
    }

    // 2. Walk through all files in the uploads directory
    function walk(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(filePath));
        } else {
          results.push(filePath);
        }
      });
      return results;
    }
    const allFiles = walk(uploadsDir);

    // 3. Detect orphan files
    const orphanFiles = allFiles.filter(f => {
      // Path relative to public
      const rel = path.relative(path.join(__dirname, '../public'), f).replace(/\\/g, '/');
      return !referenced.has('/' + rel);
    });

    if (orphanFiles.length === 0) {
      console.log('No orphan images found.');
    } else {
      console.log(`🗑️ Found ${orphanFiles.length} orphan image(s):`);
      orphanFiles.forEach(f => console.log(' -', f));
      if (!DRY_RUN) {
        orphanFiles.forEach(f => {
          try {
            fs.unlinkSync(f);
            console.log('Deleted:', f);
          } catch (err) {
            console.error('Error deleting', f, err);
          }
        });
        console.log('Cleanup done.');
      } else {
        console.log('Dry run only. Use --delete to actually remove files.');
      }
    }
    await db.end();
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
})(); 
