const db = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new user in the database
 * @param {Object} user
 * @param {string} user.email
 * @param {string} user.passwordHash
 * @param {string} user.displayName
 * @param {string} [user.preferredLanguage='en']
 * @param {boolean} [user.emailOptIn=false]
 */
async function createUser({
  email,
  passwordHash,
  displayName,
  preferredLanguage = 'en',
  emailOptIn = false
}) {
  const id = uuidv4();
  const authProvider = 'local';
  const emailVerified = false;

  const [rows] = await db.execute(
    `INSERT INTO users (
      id,
      email,
      password_hash,
      display_name,
      auth_provider,
      email_verified,
      preferred_language,
      email_optin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      email,
      passwordHash,
      displayName,
      authProvider,
      emailVerified,
      preferredLanguage,
      emailOptIn
    ]
  );

  return { id, email, displayName };
}

/**
 * Find a user by email
 * @param {string} email
 */
async function findUserByEmail(email) {
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0];
}

/**
 * Find a user by ID
 * @param {string} id
 * @returns 
 */
async function findUserById(id) {
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0];
}

/**
 * Find a user by display name
 * @param {string} displayName
 */
async function findUserByDisplayName(displayName) {
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE display_name = ? LIMIT 1`,
    [displayName]
  );
  return rows[0];
}

/**
 * Mark user's email as verified
 * @param {string} userId
 */
async function updateUserEmailVerified(userId) {
  const [result] = await db.execute(
    'UPDATE users SET email_verified = true WHERE id = ?',
    [userId]
  );
  return result;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserEmailVerified,
  findUserByDisplayName,
};
