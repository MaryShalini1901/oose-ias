const express = require('express');
const Internship = require('../models/Internship');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /internships — approved list for students; optional filters (q, domain, location, duration, sort, includeClosed)
router.get('/', async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : { status: 'approved' };

    const q = String(req.query.q || '').trim();
    const domain = String(req.query.domain || '').trim();
    const location = String(req.query.location || '').trim();
    const duration = String(req.query.duration || '').trim();
    const sort = String(req.query.sort || 'date').toLowerCase();
    const includeClosed = req.query.includeClosed === '1' || req.query.includeClosed === 'true';

    if (!includeClosed) {
      const now = new Date();
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: now } }],
      });
    }

    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ title: rx }, { company: rx }, { description: rx }] });
    }
    if (domain) {
      filter.domain = new RegExp(escapeRegex(domain), 'i');
    }
    if (location) {
      filter.location = new RegExp(escapeRegex(location), 'i');
    }
    if (duration) {
      const n = Number(duration);
      if (!Number.isNaN(n) && n > 0) {
        filter.durationWeeks = n;
      }
    }

    let sortSpec = { createdAt: -1 };
    if (sort === 'company') {
      sortSpec = { company: 1, createdAt: -1 };
    } else if (sort === 'title') {
      sortSpec = { title: 1, createdAt: -1 };
    }

    const internships = await Internship.find(filter).sort(sortSpec);
    res.json(internships);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /internships/mine - company views its own internships (any status)
router.get('/mine', protect, authorizeRoles('company'), async (req, res) => {
  try {
    const internships = await Internship.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(internships);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /internships - company posts new internship
router.post('/', protect, authorizeRoles('company'), async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      imageUrl,
      youtubeUrl,
      domain,
      location,
      durationWeeks,
      applicationDeadline,
      stipend,
      eligibility,
      skillsRequired,
    } = req.body;
    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Title, company, and description are required' });
    }
    let deadlineDate = null;
    if (applicationDeadline) {
      deadlineDate = new Date(applicationDeadline);
      if (Number.isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ message: 'Invalid application deadline date' });
      }
    }
    let weeks = null;
    if (durationWeeks != null && String(durationWeeks).trim() !== '') {
      weeks = Number(durationWeeks);
      if (Number.isNaN(weeks) || weeks < 1) {
        return res.status(400).json({ message: 'Duration must be a positive number of weeks' });
      }
    }
    const internship = await Internship.create({
      title,
      company,
      description,
      imageUrl: imageUrl || '',
      youtubeUrl: youtubeUrl || '',
      domain: domain || '',
      location: location || '',
      durationWeeks: weeks,
      applicationDeadline: deadlineDate,
      stipend: stipend || '',
      eligibility: eligibility || '',
      skillsRequired: skillsRequired || '',
      postedBy: req.user._id,
    });
    res.status(201).json(internship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /internships/:id/update - company updates own internship
router.put('/:id/update', protect, authorizeRoles('company'), async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (String(internship.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own postings' });
    }

    const {
      title,
      company,
      description,
      imageUrl,
      youtubeUrl,
      domain,
      location,
      durationWeeks,
      applicationDeadline,
      stipend,
      eligibility,
      skillsRequired,
    } = req.body;
    internship.title = title || internship.title;
    internship.company = company || internship.company;
    internship.description = description || internship.description;
    internship.imageUrl = typeof imageUrl === 'string' ? imageUrl : internship.imageUrl;
    internship.youtubeUrl = typeof youtubeUrl === 'string' ? youtubeUrl : internship.youtubeUrl;
    if (typeof domain === 'string') internship.domain = domain;
    if (typeof location === 'string') internship.location = location;
    if (durationWeeks != null && String(durationWeeks).trim() !== '') {
      const w = Number(durationWeeks);
      internship.durationWeeks = Number.isNaN(w) ? internship.durationWeeks : w;
    }
    if (applicationDeadline !== undefined) {
      if (!applicationDeadline) {
        internship.applicationDeadline = null;
      } else {
        const d = new Date(applicationDeadline);
        if (!Number.isNaN(d.getTime())) internship.applicationDeadline = d;
      }
    }
    if (typeof stipend === 'string') internship.stipend = stipend;
    if (typeof eligibility === 'string') internship.eligibility = eligibility;
    if (typeof skillsRequired === 'string') internship.skillsRequired = skillsRequired;
    internship.status = 'pending'; // re-verify after update
    await internship.save();
    res.json(internship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /internships/update/:id - alias (prevents 404 if frontend uses different order)
router.put('/update/:id', protect, authorizeRoles('company'), async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (String(internship.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own postings' });
    }

    const {
      title,
      company,
      description,
      imageUrl,
      youtubeUrl,
      domain,
      location,
      durationWeeks,
      applicationDeadline,
      stipend,
      eligibility,
      skillsRequired,
    } = req.body;
    internship.title = title || internship.title;
    internship.company = company || internship.company;
    internship.description = description || internship.description;
    internship.imageUrl = typeof imageUrl === 'string' ? imageUrl : internship.imageUrl;
    internship.youtubeUrl = typeof youtubeUrl === 'string' ? youtubeUrl : internship.youtubeUrl;
    if (typeof domain === 'string') internship.domain = domain;
    if (typeof location === 'string') internship.location = location;
    if (durationWeeks != null && String(durationWeeks).trim() !== '') {
      const w = Number(durationWeeks);
      internship.durationWeeks = Number.isNaN(w) ? internship.durationWeeks : w;
    }
    if (applicationDeadline !== undefined) {
      if (!applicationDeadline) {
        internship.applicationDeadline = null;
      } else {
        const d = new Date(applicationDeadline);
        if (!Number.isNaN(d.getTime())) internship.applicationDeadline = d;
      }
    }
    if (typeof stipend === 'string') internship.stipend = stipend;
    if (typeof eligibility === 'string') internship.eligibility = eligibility;
    if (typeof skillsRequired === 'string') internship.skillsRequired = skillsRequired;
    internship.status = 'pending'; // re-verify after update
    await internship.save();
    res.json(internship);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /internships/:id - company deletes its own internship
router.delete('/:id', protect, authorizeRoles('company'), async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id);
    if (!internship) return res.status(404).json({ message: 'Not found' });
    if (String(internship.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own postings' });
    }

    await internship.deleteOne();
    res.json({ message: 'Internship deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

