const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /notifications/unread-count — badge (must be before /:id)
router.get('/unread-count', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('notificationsEnabled');
    if (me && me.notificationsEnabled === false) {
      return res.json({ count: 0 });
    }
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /notifications/read-all
router.post('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json(n);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /notifications — list (newest first); empty when user turned notifications off
router.get('/', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('notificationsEnabled');
    if (me && me.notificationsEnabled === false) {
      return res.json([]);
    }
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
