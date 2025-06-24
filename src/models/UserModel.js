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

/**
 * Update user profile fields
 * @param {string} userId
 * @param {Object} updates
 * @param {string} [updates.email]
 * @param {string} [updates.passwordHash]
 * @param {string} [updates.preferredLanguage]
 * @param {boolean} [updates.emailOptIn]
 * @param {string} [updates.photoUrl]
 */
async function updateUserProfile(userId, updates) {
  const fields = [];
  const values = [];

  if (updates.email) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.passwordHash) {
    fields.push('password_hash = ?');
    values.push(updates.passwordHash);
  }
  if (updates.preferredLanguage) {
    fields.push('preferred_language = ?');
    values.push(updates.preferredLanguage);
  }
  if (typeof updates.emailOptIn === 'boolean') {
    fields.push('email_optin = ?');
    values.push(updates.emailOptIn);
  }
  if (updates.photoUrl) {
    fields.push('photo_url = ?');
    values.push(updates.photoUrl);
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(userId);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  const [result] = await db.execute(sql, values);
  return result;
}

/**
 * Update user's password
 * @param {string} userId
 * @param {string} passwordHash
 */
async function updatePassword(userId, passwordHash) {
  const [result] = await db.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, userId]
  );
  return result;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserEmailVerified,
  findUserByDisplayName,
  updateUserProfile,
  updatePassword,
};
