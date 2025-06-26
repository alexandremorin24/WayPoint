const MapInvitationModel = require('../src/models/MapInvitationModel');
const logger = require('../src/utils/logger');

/**
 * Clean up expired invitations
 */
async function cleanupExpiredInvitations() {
  try {
    const result = await MapInvitationModel.cleanupExpiredInvitations();
    logger.info('Expired invitations cleanup completed');
    return result;
  } catch (error) {
    logger.error('Error during expired invitations cleanup:', error);
    throw error;
  }
}

/**
 * Run all cleanup jobs
 */
async function runCleanupJobs() {
  try {
    await cleanupExpiredInvitations();
  } catch (error) {
    logger.error('Error during cleanup jobs execution:', error);
  }
}

// Run cleanup every week
const CLEANUP_INTERVAL = 60 * 60 * 24 * 7; // 1 week
setInterval(runCleanupJobs, CLEANUP_INTERVAL);

// Run cleanup on startup
runCleanupJobs();

module.exports = {
  cleanupExpiredInvitations,
  runCleanupJobs
};
