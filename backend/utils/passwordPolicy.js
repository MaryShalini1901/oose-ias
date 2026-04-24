const MIN_LEN = 8;
const MAX_LEN = 128;

/**
 * Company & Admin: strong password (length + mixed case + digit + special).
 * Student: at least 8 chars, must include one letter and one number.
 */
function validatePasswordStrength(password, role) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  const p = password;
  if (p.length < MIN_LEN) {
    return { valid: false, message: `Password must be at least ${MIN_LEN} characters long` };
  }
  if (p.length > MAX_LEN) {
    return { valid: false, message: `Password must be at most ${MAX_LEN} characters` };
  }

  if (role === 'company' || role === 'admin') {
    if (!/[A-Z]/.test(p)) {
      return {
        valid: false,
        message: 'Company/Admin password must include at least one uppercase letter (A–Z)',
      };
    }
    if (!/[a-z]/.test(p)) {
      return {
        valid: false,
        message: 'Company/Admin password must include at least one lowercase letter (a–z)',
      };
    }
    if (!/[0-9]/.test(p)) {
      return {
        valid: false,
        message: 'Company/Admin password must include at least one digit (0–9)',
      };
    }
    if (!/[^a-zA-Z0-9]/.test(p)) {
      return {
        valid: false,
        message:
          'Company/Admin password must include at least one special character (symbol, punctuation, etc.)',
      };
    }
  } else {
    if (!/[a-zA-Z]/.test(p)) {
      return {
        valid: false,
        message: 'Student password must include at least one letter',
      };
    }
    if (!/[0-9]/.test(p)) {
      return {
        valid: false,
        message: 'Student password must include at least one number',
      };
    }
  }

  return { valid: true };
}

function passwordMatchesUsername(password, username) {
  if (!username || !password) return false;
  return password.toLowerCase() === String(username).trim().toLowerCase();
}

module.exports = {
  MIN_LEN,
  MAX_LEN,
  validatePasswordStrength,
  passwordMatchesUsername,
};
