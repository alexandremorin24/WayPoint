const { closeConnection } = require('./config/database');

module.exports = async () => {
  console.log('[TEARDOWN] Closing database connection...');
  await closeConnection();
};
