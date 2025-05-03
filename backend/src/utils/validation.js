const validator = require('validator');

/**
 * Validate email format using the 'validator' library
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
exports.validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  return validator.isEmail(email);
};

/**
 * Validate password strength using the 'validator' library
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and error message
 */
exports.validatePassword = (password) => {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password must be a string'
    };
  }

  // Use the same rules as backend registration
  const options = {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    returnScore: false
  };

  if (!validator.isStrongPassword(password, options)) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long and include uppercase, lowercase, number and symbol.'
    };
  }

  if (password.length > 100) {
    return {
      isValid: false,
      error: 'Password must not exceed 100 characters'
    };
  }

  return {
    isValid: true,
    error: null
  };
}; 
