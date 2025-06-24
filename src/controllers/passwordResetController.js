const UserModel = require('../models/UserModel')
const PasswordResetTokenModel = require('../models/PasswordResetTokenModel')
const { sendPasswordResetEmail } = require('../utils/mailer')
const bcrypt = require('bcrypt')

// Password strength validation
const validatePasswordStrength = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!hasUpperCase || !hasLowerCase) {
    return { valid: false, message: 'Password must contain both uppercase and lowercase letters' }
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }

  return { valid: true }
}

// 🔐 [POST] /api/password-reset/request
const requestReset = async (req, res) => {
  const { email } = req.body
  const locale = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en'

  try {
    // Check if user exists
    const user = await UserModel.findUserByEmail(email)
    if (!user) {
      // For security reasons, always return success
      return res.status(200).json({ message: 'If an account exists with this email, you will receive a password reset link.' })
    }

    // Delete expired tokens
    await PasswordResetTokenModel.deleteExpiredTokens()

    // Create new token
    const token = await PasswordResetTokenModel.createToken(user.id)

    // Send email with user's preferred language
    await sendPasswordResetEmail(user.email, user.display_name, token, locale)

    res.status(200).json({ message: 'If an account exists with this email, you will receive a password reset link.' })
  } catch (error) {
    console.error('Error in password reset request:', error)
    res.status(500).json({ error: 'An error occurred while processing your request.' })
  }
}

// 🔐 [GET] /api/password-reset/validate/:token
const validateToken = async (req, res) => {
  const { token } = req.params

  try {
    const tokenData = await PasswordResetTokenModel.validateToken(token)
    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired token.' })
    }

    res.status(200).json({ valid: true })
  } catch (error) {
    console.error('Error validating token:', error)
    res.status(500).json({ error: 'An error occurred while validating the token.' })
  }
}

// 🔐 [POST] /api/password-reset/reset/:token
const resetPassword = async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  try {
    // Validate token
    const tokenData = await PasswordResetTokenModel.validateToken(token)
    if (!tokenData) {
      console.log(`[Password Reset] Invalid token attempt: ${token}`)
      return res.status(400).json({ error: 'Invalid or expired token.' })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      console.log(`[Password Reset] Weak password attempt for user: ${tokenData.user_id}`)
      return res.status(400).json({ error: passwordValidation.message })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password
    await UserModel.updatePassword(tokenData.user_id, hashedPassword)

    // Mark token as used
    await PasswordResetTokenModel.markTokenAsUsed(token)

    console.log(`[Password Reset] Successfully reset password for user: ${tokenData.user_id}`)
    res.status(200).json({ message: 'Password has been reset successfully.' })
  } catch (error) {
    console.error('[Password Reset] Error resetting password:', error)
    res.status(500).json({ error: 'An error occurred while resetting your password.' })
  }
}

module.exports = {
  requestReset,
  validateToken,
  resetPassword
} 
