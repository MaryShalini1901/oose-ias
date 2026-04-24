const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { validatePasswordStrength, passwordMatchesUsername } = require('../utils/passwordPolicy');
const { validateUsername, validateRegisterProfile } = require('../utils/registerValidation');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Slow brute-force attempts on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const ip = req.ip || '';
    const bodyUsername = req.body && req.body.username ? String(req.body.username).trim().toLowerCase() : 'unknown';
    return `${ip}|${bodyUsername}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '7d',
  });
};

function userPayload(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    notificationsEnabled: user.notificationsEnabled !== false,
    internshipAlerts: user.internshipAlerts !== false,
  };
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, fullName, email, phone } = req.body;
    if (!username || !password || !role || fullName == null) {
      return res.status(400).json({
        message: 'Username, password, role, and full name are required',
      });
    }

    const uCheck = validateUsername(username);
    if (!uCheck.valid) {
      return res.status(400).json({ message: uCheck.message });
    }
    const trimmedUser = uCheck.username;

    const profile = validateRegisterProfile({ fullName, email, phone, role });
    if (!profile.valid) {
      return res.status(400).json({ message: profile.message });
    }

    const strength = validatePasswordStrength(password, role);
    if (!strength.valid) {
      return res.status(400).json({ message: strength.message });
    }
    if (passwordMatchesUsername(password, trimmedUser)) {
      return res.status(400).json({ message: 'Password must not be the same as your username' });
    }

    const existing = await User.findOne({ username: trimmedUser });
    if (existing) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    if (profile.emailNorm) {
      const emailTaken = await User.findOne({ email: profile.emailNorm });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    const userDoc = {
      username: trimmedUser,
      password,
      role,
      fullName: String(fullName).trim(),
      phone: profile.phoneDigits || '',
    };
    if (profile.emailNorm) {
      userDoc.email = profile.emailNorm;
    }
    const user = await User.create(userDoc);
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      token,
      user: userPayload(user),
      message: 'Registration successful',
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Email or username already registered' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /auth/me/notifications — toggle in-app notification preferences
router.patch('/me/notifications', protect, async (req, res) => {
  try {
    const { notificationsEnabled, internshipAlerts } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (typeof notificationsEnabled === 'boolean') {
      user.notificationsEnabled = notificationsEnabled;
    }
    if (typeof internshipAlerts === 'boolean') {
      user.internshipAlerts = internshipAlerts;
    }
    await user.save();
    res.json({ user: userPayload(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const trimmedUser = username != null ? String(username).trim() : '';
    if (!trimmedUser || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await User.findOne({ username: trimmedUser });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);
    res.json({
      token,
      user: userPayload(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

