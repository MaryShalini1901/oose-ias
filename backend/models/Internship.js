const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
    domain: { type: String, default: '' },
    location: { type: String, default: '' },
    durationWeeks: { type: Number, default: null },
    applicationDeadline: { type: Date, default: null },
    stipend: { type: String, default: '' },
    eligibility: { type: String, default: '' },
    skillsRequired: { type: String, default: '' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Internship', InternshipSchema);

