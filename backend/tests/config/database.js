const db = require('../../src/utils/db');

let connection;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const resetTestDatabase = async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      // Start transaction
      await db.query('START TRANSACTION');

      // Disable foreign key checks temporarily
      await db.query('SET FOREIGN_KEY_CHECKS = 0');

      // Delete all test data in reverse order of dependencies
      await db.execute('TRUNCATE TABLE poi_logs');
      await db.execute('TRUNCATE TABLE poi_user_stats');
      await db.execute('TRUNCATE TABLE map_votes');
      await db.execute('TRUNCATE TABLE pois');
      await db.execute('TRUNCATE TABLE categories');
      await db.execute('TRUNCATE TABLE map_user_roles');
      await db.execute('TRUNCATE TABLE maps');
      await db.execute('TRUNCATE TABLE users');
      await db.execute('TRUNCATE TABLE games');

      // Reset sequences
      await db.query('ALTER TABLE games AUTO_INCREMENT = 1');
      await db.query('ALTER TABLE users AUTO_INCREMENT = 1');
      await db.query('ALTER TABLE maps AUTO_INCREMENT = 1');

      // Vérifier que les tables sont vides
      const [poiLogs] = await db.query('SELECT COUNT(*) as count FROM poi_logs');
      const [poiUserStats] = await db.query('SELECT COUNT(*) as count FROM poi_user_stats');
      const [mapVotes] = await db.query('SELECT COUNT(*) as count FROM map_votes');
      const [pois] = await db.query('SELECT COUNT(*) as count FROM pois');
      const [categories] = await db.query('SELECT COUNT(*) as count FROM categories');
      const [mapUserRoles] = await db.query('SELECT COUNT(*) as count FROM map_user_roles');
      const [maps] = await db.query('SELECT COUNT(*) as count FROM maps');
      const [users] = await db.query('SELECT COUNT(*) as count FROM users');
      const [games] = await db.query('SELECT COUNT(*) as count FROM games');

      if (poiLogs[0].count > 0 || poiUserStats[0].count > 0 || mapVotes[0].count > 0 ||
        pois[0].count > 0 || categories[0].count > 0 || mapUserRoles[0].count > 0 ||
        maps[0].count > 0 || users[0].count > 0 || games[0].count > 0) {
        throw new Error('Tables not properly truncated');
      }

      // Re-enable foreign key checks
      await db.query('SET FOREIGN_KEY_CHECKS = 1');

      // Commit transaction
      await db.query('COMMIT');
      return; // Si on arrive ici, tout s'est bien passé
    } catch (error) {
      // Rollback in case of error
      try {
        await db.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }

      console.error(`Error resetting test database (attempt ${4 - retries}/3):`, error);
      retries--;

      if (retries === 0) {
        throw error;
      }

      // Attendre entre les tentatives
      await sleep(1000);
    }
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
