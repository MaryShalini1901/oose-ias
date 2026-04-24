/**
 * Apply form validation (student internship application).
 */

function normalizePhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function isValidEmail(email) {
  const e = String(email || '').trim();
  if (!e || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Letters + marks (Tamil/English etc.), spaces, . ' - — no digits */
function isValidFullName(name) {
  const t = String(name || '').trim();
  if (t.length < 2 || t.length > 200) return false;
  if (/\d/.test(t)) return false;
  return /^[\p{L}\p{M}\s.'-]+$/u.test(t);
}

const RESUME_MAX_LEN = 2048;

/** Optional resume link: valid http(s) URL and length; block risky file extensions. */
function validateResumeLinkOptional(resumeLink) {
  const raw = String(resumeLink || '').trim();
  if (!raw) return { valid: true, value: '' };
  if (raw.length > RESUME_MAX_LEN) {
    return { valid: false, message: 'Resume link is too long (max 2048 characters).' };
  }
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { valid: false, message: 'Resume link must be a valid http or https URL.' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { valid: false, message: 'Resume link must use http or https.' };
  }
  const path = u.pathname + u.search;
  if (/\.(exe|bat|cmd|sh|msi)(\?|#|$)/i.test(path)) {
    return { valid: false, message: 'This file type is not allowed for resume link.' };
  }
  return { valid: true, value: raw };
}

function validateApplyFields({ fullName, email, phone }) {
  if (!isValidFullName(fullName)) {
    return {
      valid: false,
      message:
        'Full name must be 2–200 characters, letters only (no numbers). Spaces and . - \' are allowed.',
    };
  }
  if (!isValidEmail(email)) {
    return { valid: false, message: 'Enter a valid email address.' };
  }
  const digits = normalizePhoneDigits(phone);
  if (digits.length !== 10) {
    return { valid: false, message: 'Phone must contain exactly 10 digits.' };
  }
  return { valid: true, phoneDigits: digits };
}

module.exports = {
  validateApplyFields,
  validateResumeLinkOptional,
  normalizePhoneDigits,
  isValidEmail,
  isValidFullName,
};
