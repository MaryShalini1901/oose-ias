const { isValidEmail, isValidFullName, normalizePhoneDigits } = require('./applyValidation');

function validateUsername(username) {
  const u = String(username || '').trim();
  if (u.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters.' };
  }
  if (u.length > 64) {
    return { valid: false, message: 'Username is too long.' };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) {
    return {
      valid: false,
      message: 'Username may use only letters, numbers, dot (.), underscore (_), and hyphen (-).',
    };
  }
  return { valid: true, username: u };
}

function validateRegisterProfile({ fullName, email, phone }) {
  if (!isValidFullName(fullName)) {
    return {
      valid: false,
      message:
        'Full name must be 2–200 characters, letters only (no numbers). Spaces and . - \' are allowed.',
    };
  }
  const emailTrim = String(email || '').trim();
  let emailNorm = '';
  if (emailTrim) {
    if (!isValidEmail(emailTrim)) {
      return { valid: false, message: 'Enter a valid email address.' };
    }
    emailNorm = emailTrim.toLowerCase();
  }
  const phoneTrim = String(phone || '').trim();
  let phoneDigits = '';
  if (phoneTrim) {
    const digits = normalizePhoneDigits(phoneTrim);
    if (digits.length !== 10) {
      return { valid: false, message: 'Phone must contain exactly 10 digits when provided.' };
    }
    phoneDigits = digits;
  }
  return { valid: true, emailNorm, phoneDigits };
}

module.exports = {
  validateUsername,
  validateRegisterProfile,
};
