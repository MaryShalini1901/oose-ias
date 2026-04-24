const express = require('express');
const mongoose = require('mongoose');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const Application = require('../models/Application');
const User = require('../models/User');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware: only admin
router.use(protect, authorizeRoles('admin'));

// GET /admin/application-stats-today — application counts for server local calendar day
router.get('/application-stats-today', async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const range = { $gte: start, $lt: end };
    const [appliedToday, approvedToday, rejectedToday] = await Promise.all([
      Application.countDocuments({ createdAt: range }),
      Application.countDocuments({ status: 'approved', updatedAt: range }),
      Application.countDocuments({ status: 'rejected', updatedAt: range }),
    ]);
    res.json({
      appliedToday,
      approvedToday,
      rejectedToday,
      date: start.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/verify - list pending internships
router.get('/verify', async (req, res) => {
  try {
    const pending = await Internship.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/approve
router.post('/approve', async (req, res) => {
  try {
    const { internshipId } = req.body;
    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });
    internship.status = 'approved';
    await internship.save();
    if (internship.postedBy) {
      await Notification.create({
        recipient: internship.postedBy,
        message: `Your internship "${internship.title}" at ${internship.company} was approved by admin.`,
      });
    }
    const deadlineNote = internship.applicationDeadline
      ? ` Apply before ${new Date(internship.applicationDeadline).toLocaleDateString()}.`
      : '';
    const students = await User.find({
      role: 'student',
      notificationsEnabled: true,
      internshipAlerts: true,
    })
      .select('_id')
      .limit(250);
    const alertMsg = `New approved internship: "${internship.title}" at ${internship.company}.${deadlineNote}`;
    await Promise.all(
      students.map((s) =>
        Notification.create({
          recipient: s._id,
          message: alertMsg,
        })
      )
    );
    res.json(internship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/reject
router.post('/reject', async (req, res) => {
  try {
    const { internshipId, reason } = req.body;
    const reasonText = String(reason || '').trim();
    if (!reasonText) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });
    internship.status = 'rejected';
    await internship.save();
    if (internship.postedBy) {
      await Notification.create({
        recipient: internship.postedBy,
        message: `Your internship "${internship.title}" at ${internship.company} was rejected by admin. Reason: ${reasonText}`,
      });
    }
    res.json(internship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/notify - send notification to a student
router.post('/notify', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    if (!recipientId || !message) {
      return res.status(400).json({ message: 'recipientId and message are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid student user id' });
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    const notification = await Notification.create({
      recipient: recipientId,
      message: String(message).trim(),
    });
    res.status(201).json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /admin/reset-demo - clear only demo workflow data
// Leaves internships/users intact.
router.post('/reset-demo', async (req, res) => {
  try {
    // basic guard to avoid accidental calls
    if (!req.body || !req.body.confirm) {
      return res.status(400).json({ message: 'confirm is required' });
    }
    await Application.deleteMany({});
    await Notification.deleteMany({});
    res.json({ ok: true, message: 'Demo reset complete (applications + notifications cleared).' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /admin/notifications/:userId - list notifications for a user (simple helper)
router.get('/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

