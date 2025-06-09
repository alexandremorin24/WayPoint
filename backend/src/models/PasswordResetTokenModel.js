const db = require('../utils/db')
const { v4: uuidv4 } = require('uuid')
const crypto = require('crypto')

class PasswordResetTokenModel {
  static async createToken(userId) {
    // Check number of active tokens for this user
    const activeTokensCount = await this.getActiveTokensCount(userId)
    if (activeTokensCount >= 3) {
      throw new Error('Too many active password reset requests. Please wait or contact support.')
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const query = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `

    try {
      await db.query(query, [userId, token, expiresAt])
      return token
    } catch (error) {
      console.error('Error creating password reset token:', error)
      throw error
    }
  }

  static async getActiveTokensCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM password_reset_tokens
      WHERE user_id = ? AND used = FALSE AND expires_at > NOW()
    `

    try {
      const [rows] = await db.query(query, [userId])
      return rows[0].count
    } catch (error) {
      console.error('Error getting active tokens count:', error)
      throw error
    }
  }

  static async validateToken(token) {
    const query = `
      SELECT prt.*, u.email, u.display_name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()
    `

    try {
      const [rows] = await db.query(query, [token])
      return rows[0]
    } catch (error) {
      console.error('Error validating password reset token:', error)
      throw error
    }
  }

  static async markTokenAsUsed(token) {
    const query = `
      UPDATE password_reset_tokens
      SET used = TRUE
      WHERE token = ?
    `

    try {
      await db.query(query, [token])
    } catch (error) {
      console.error('Error marking token as used:', error)
      throw error
    }
  }

  static async deleteExpiredTokens() {
    const query = `
      DELETE FROM password_reset_tokens
      WHERE expires_at < NOW() OR used = TRUE
    `

    try {
      await db.query(query)
    } catch (error) {
      console.error('Error deleting expired tokens:', error)
      throw error
    }
  }
}

module.exports = PasswordResetTokenModel 
