const db = require('../src/utils/db');

module.exports = async () => {
  console.log('[TEARDOWN] Closing database connection...');
  await db.end();
};
