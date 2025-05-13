const db = require('../../src/utils/db');

let connection;

const resetTestDatabase = async () => {
  try {
    // Delete all test data
    await db.execute('DELETE FROM map_user_roles');
    await db.execute('DELETE FROM maps');
    await db.execute('DELETE FROM users');
    await db.execute('DELETE FROM games');

    // Reset sequences if needed
    await db.execute('ALTER TABLE maps AUTO_INCREMENT = 1');
    await db.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    await db.execute('ALTER TABLE games AUTO_INCREMENT = 1');
  } catch (error) {
    console.error('Error resetting test database:', error);
    throw error;
  }
};

const closeConnection = async () => {
  if (connection) {
    try {
      await connection.end();
      connection = null;
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
};

module.exports = {
  resetTestDatabase,
  closeConnection
}; 
