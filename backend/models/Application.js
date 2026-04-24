const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    education: { type: String, default: '' },
    qualification: { type: String, default: '' },
    skills: { type: String, default: '' },
    resumeLink: { type: String, default: '' },
    coverLetter: { type: String, default: '' },
    status: {
      type: String,
      enum: ['applied', 'approved', 'rejected'],
      default: 'applied',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', ApplicationSchema);

