const express = require('express');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { validateApplyFields, validateResumeLinkOptional } = require('../utils/applyValidation');

const router = express.Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /apply - student applies for internship
router.post('/apply', protect, authorizeRoles('student'), async (req, res) => {
  try {
    const {
      internshipId,
      fullName,
      email,
      phone,
      education,
      qualification,
      skills,
      resumeLink,
      coverLetter,
    } = req.body;
    if (!internshipId) {
      return res.status(400).json({ message: 'Internship is required' });
    }
    const fullNameTrim = String(fullName || '').trim();
    const emailTrim = String(email || '').trim();
    const phoneTrim = String(phone || '').trim();
    if (!fullNameTrim || !emailTrim || !phoneTrim) {
      return res.status(400).json({ message: 'Full name, email, and phone are required' });
    }
    const fieldCheck = validateApplyFields({
      fullName: fullNameTrim,
      email: emailTrim,
      phone: phoneTrim,
    });
    if (!fieldCheck.valid) {
      return res.status(400).json({ message: fieldCheck.message });
    }
    const internship = await Internship.findById(internshipId);
    if (!internship || internship.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid or unavailable internship' });
    }
    if (internship.applicationDeadline) {
      const end = new Date(internship.applicationDeadline);
      if (!Number.isNaN(end.getTime()) && end < new Date()) {
        return res.status(400).json({ message: 'Applications are closed for this internship.' });
      }
    }

    const resumeCheck = validateResumeLinkOptional(resumeLink);
    if (!resumeCheck.valid) {
      return res.status(400).json({ message: resumeCheck.message });
    }

    const existing = await Application.findOne({
      student: req.user._id,
      internshipId,
    });
    if (existing) {
      return res.status(400).json({ message: 'Already applied to this internship' });
    }

    const application = await Application.create({
      student: req.user._id,
      internshipId,
      fullName: fullNameTrim,
      email: emailTrim,
      phone: fieldCheck.phoneDigits,
      education: education || '',
      qualification: qualification || '',
      skills: skills || '',
      resumeLink: resumeCheck.value || '',
      coverLetter: coverLetter || '',
    });

    const applyMsg = `New application for "${internship.title}" from ${fullNameTrim} (${emailTrim}).`;

    // Notify company (poster) — same message as admin sees on the front page
    if (internship.postedBy) {
      await Notification.create({
        recipient: internship.postedBy,
        message: applyMsg,
      });
    }

    // Notify every admin account (same application event)
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          message: applyMsg,
        })
      )
    );

    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /applications/:id/view - view single application (student, company, or admin)
router.get('/applications/:id/view', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('student', 'username')
      .populate('internshipId', 'title company postedBy');

    if (!application) return res.status(404).json({ message: 'Not found' });

    const isStudent = application.student && String(application.student._id) === String(req.user._id);
    let isCompany = false;
    if (req.user.role === 'company' && application.internshipId) {
      const inv = application.internshipId;
      if (inv.postedBy && String(inv.postedBy) === String(req.user._id)) {
        isCompany = true;
      } else if (!inv.postedBy && new RegExp(`^${escapeRegex(req.user.username)}$`, 'i').test(String(inv.company || ''))) {
        isCompany = true;
      }
    }

    if (!isStudent && !isCompany && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /applications - student: own; company: for their posted internships; admin: all
router.get('/applications', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (req.user.role === 'company') {
      const byPoster = await Internship.find({ postedBy: req.user._id }).select('_id');
      const legacy = await Internship.find({
        $or: [{ postedBy: { $exists: false } }, { postedBy: null }],
        company: new RegExp(`^${escapeRegex(req.user.username)}$`, 'i'),
      }).select('_id');
      const idSet = new Map();
      [...byPoster, ...legacy].forEach((doc) => idSet.set(String(doc._id), doc._id));
      const ids = Array.from(idSet.values());
      if (ids.length === 0) {
        return res.json([]);
      }
      filter.internshipId = { $in: ids };
    }
    // admin: empty filter => all applications
    const applications = await Application.find(filter)
      .populate('student', 'username')
      .populate('internshipId', 'title company postedBy');
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /applications/:id/status - company (own internships) or admin updates status; notifies student
router.patch('/applications/:id/status', protect, authorizeRoles('company', 'admin'), async (req, res) => {
  try {
    const { status, reason } = req.body; // approved/rejected
    const application = await Application.findById(req.params.id).populate('internshipId');
    if (!application) return res.status(404).json({ message: 'Not found' });

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const reasonText = String(reason || '').trim();
    if (status === 'rejected' && !reasonText) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    if (req.user.role === 'company') {
      if (!application.internshipId) {
        return res.status(403).json({ message: 'You can only update applications for your internships' });
      }
      const ownsByPoster = String(application.internshipId.postedBy) === String(req.user._id);
      const legacyCompanyMatch =
        !application.internshipId.postedBy &&
        new RegExp(`^${escapeRegex(req.user.username)}$`, 'i').test(
          String(application.internshipId.company || '')
        );
      if (!ownsByPoster && !legacyCompanyMatch) {
        return res.status(403).json({ message: 'You can only update applications for your internships' });
      }
    }

    application.status = status;
    await application.save();

    await Notification.create({
      recipient: application.student,
      message:
        status === 'rejected'
          ? `Your application for "${application.internshipId.title}" was rejected. Reason: ${reasonText}`
          : `Your application for "${application.internshipId.title}" was approved.`,
    });

    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

