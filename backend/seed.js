/* eslint-disable no-console */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const User = require('./models/User');
const Internship = require('./models/Internship');
const Application = require('./models/Application');
const Notification = require('./models/Notification');

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_awareness';
  await mongoose.connect(uri);
}

function pick(arr, i) {
  return arr[i % arr.length];
}

async function resetDemoData() {
  // Keep internships unless you pass --reset-all
  await Application.deleteMany({});
  await Notification.deleteMany({});
}

async function resetAll() {
  await Application.deleteMany({});
  await Notification.deleteMany({});
  await Internship.deleteMany({});
  await User.deleteMany({});
}

async function ensureUser({ username, password, role, fullName, email, phone }) {
  const existing = await User.findOne({ username });
  if (existing) {
    if (email && (!existing.email || String(existing.email).trim() === '')) {
      try {
        existing.fullName = fullName || existing.fullName || username;
        existing.email = String(email).toLowerCase().trim();
        if (phone != null && String(phone).trim() !== '') {
          existing.phone = String(phone).replace(/\D/g, '');
        }
        if (existing.notificationsEnabled === undefined) existing.notificationsEnabled = true;
        if (existing.internshipAlerts === undefined) existing.internshipAlerts = true;
        await existing.save();
      } catch (e) {
        console.warn('Could not upgrade user profile for', username, e.message);
      }
    }
    return existing;
  }
  const u = await User.create({
    username,
    password,
    role,
    fullName: fullName || username,
    email: String(email).toLowerCase().trim(),
    phone: phone || '',
    notificationsEnabled: true,
    internshipAlerts: true,
  });
  return u;
}

async function main() {
  const args = process.argv.slice(2);
  const doResetAll = args.includes('--reset-all');
  const doResetDemo = args.includes('--reset-demo') || !doResetAll;

  await connect();
  console.log('Connected to MongoDB');

  if (doResetAll) {
    console.log('Resetting ALL collections (users, internships, applications, notifications)...');
    await resetAll();
  } else if (doResetDemo) {
    console.log('Resetting demo workflow data (applications, notifications)...');
    await resetDemoData();
  }

  // Create 1 admin + 1 company + 5 students
  const admin = await ensureUser({
    username: 'admin_ias',
    password: 'Admin@123',
    role: 'admin',
    fullName: 'IAS Admin',
    email: 'admin.ias@demo.lab',
    phone: '',
  });
  const company = await ensureUser({
    username: 'company_ias',
    password: 'Comp@1234',
    role: 'company',
    fullName: 'Demo Company',
    email: 'company.ias@demo.lab',
    phone: '',
  });

  const students = [];
  const studentSeeds = [
    {
      username: 'shalini',
      password: 'Hello123',
      role: 'student',
      fullName: 'Shalini R',
      email: 'shalini.student@demo.lab',
      phone: '9876543210',
    },
    {
      username: 'arun',
      password: 'Hello123',
      role: 'student',
      fullName: 'Arun K',
      email: 'arun.student@demo.lab',
      phone: '9123456780',
    },
    {
      username: 'meena',
      password: 'Hello123',
      role: 'student',
      fullName: 'Meena S',
      email: 'meena.student@demo.lab',
      phone: '9001122334',
    },
    {
      username: 'kavin',
      password: 'Hello123',
      role: 'student',
      fullName: 'Kavin M',
      email: 'kavin.student@demo.lab',
      phone: '8899776655',
    },
    {
      username: 'divya',
      password: 'Hello123',
      role: 'student',
      fullName: 'Divya P',
      email: 'divya.student@demo.lab',
      phone: '9788012345',
    },
  ];
  for (const s of studentSeeds) {
    students.push(await ensureUser(s));
  }

  // Create 10 internships (approved) posted by company
  const internships = [];
  const deadlineFar = new Date('2026-12-31T23:59:59.000Z');
  const internshipSeeds = [
    {
      title: 'UI/UX Design Intern',
      company: 'Codex Studio',
      description: 'Work on modern UI screens, components, and UX improvements for a web product.',
      domain: 'Design',
      location: 'Chennai',
      durationWeeks: 8,
      applicationDeadline: deadlineFar,
      stipend: '₹12,000 / month',
      eligibility: 'Pursuing or completed design-related degree; portfolio preferred.',
      skillsRequired: 'Figma basics, visual design sense, communication',
    },
    {
      title: 'Frontend Developer Intern',
      company: 'NovaWeb Labs',
      description: 'Build responsive pages using HTML/CSS/JS and integrate REST APIs.',
      domain: 'Web',
      location: 'Bangalore',
      durationWeeks: 10,
      applicationDeadline: deadlineFar,
      stipend: '₹15,000 / month',
      eligibility: 'CS / IT students in 3rd year or above.',
      skillsRequired: 'HTML, CSS, JavaScript, REST APIs',
    },
    {
      title: 'Backend Developer Intern (Node.js)',
      company: 'CloudSprint',
      description: 'Develop Express APIs, MongoDB models, and authentication middleware.',
      domain: 'Web',
      location: 'Remote',
      durationWeeks: 12,
      applicationDeadline: deadlineFar,
      stipend: 'Not specified',
      eligibility: 'Understanding of HTTP, JSON, and databases.',
      skillsRequired: 'Node.js, Express, MongoDB',
    },
    {
      title: 'Data Analyst Intern',
      company: 'InsightWorks',
      description: 'Clean datasets, write SQL queries, and create dashboards with insights.',
      domain: 'Data',
      location: 'Hyderabad',
      durationWeeks: 8,
      applicationDeadline: deadlineFar,
      stipend: '₹10,000 / month',
      eligibility: 'Comfort with spreadsheets and basic statistics.',
      skillsRequired: 'SQL, Excel or Sheets, curiosity for data',
    },
    {
      title: 'Cybersecurity Intern',
      company: 'SecureByte',
      description: 'Assist in vulnerability scanning, logging, and security checklists.',
      domain: 'Security',
      location: 'Pune',
      durationWeeks: 6,
      applicationDeadline: deadlineFar,
      stipend: '',
      eligibility: 'Interest in networks and secure coding practices.',
      skillsRequired: 'Basics of OS, networking, attention to detail',
    },
    {
      title: 'Java Developer Intern',
      company: 'JForce Systems',
      description: 'OOP-focused development and small modules in Java with MySQL.',
      domain: 'Software',
      location: 'Coimbatore',
      durationWeeks: 10,
      applicationDeadline: deadlineFar,
      stipend: '₹8,000 / month',
      eligibility: 'Core Java and OOP completed in coursework.',
      skillsRequired: 'Java, OOP, MySQL basics',
    },
    {
      title: 'Python Developer Intern',
      company: 'PyCraft',
      description: 'Automations, scripting, and small API integrations using Python.',
      domain: 'Software',
      location: 'Remote',
      durationWeeks: 8,
      applicationDeadline: deadlineFar,
      stipend: '₹11,000 / month',
      eligibility: 'Python course or project experience.',
      skillsRequired: 'Python, pip, basic APIs',
    },
    {
      title: 'QA / Testing Intern',
      company: 'TestNest',
      description: 'Write test cases, do manual testing, and basic API validation.',
      domain: 'Quality',
      location: 'Chennai',
      durationWeeks: 6,
      applicationDeadline: deadlineFar,
      stipend: '₹9,000 / month',
      eligibility: 'Methodical mindset; no prior QA mandatory.',
      skillsRequired: 'Documentation, basic API tools (Postman)',
    },
    {
      title: 'Full Stack Intern',
      company: 'StackUp',
      description: 'End-to-end tasks: UI + Node APIs + MongoDB, with Git workflow.',
      domain: 'Web',
      location: 'Bangalore',
      durationWeeks: 12,
      applicationDeadline: deadlineFar,
      stipend: '₹18,000 / month',
      eligibility: 'Prior mini full-stack project is a plus.',
      skillsRequired: 'HTML/CSS/JS, Node, MongoDB, Git',
    },
    {
      title: 'Cloud Intern',
      company: 'SkyDeploy',
      description: 'Learn deployment basics, env config, and monitoring for Node apps.',
      domain: 'Cloud',
      location: 'Remote',
      durationWeeks: 8,
      applicationDeadline: deadlineFar,
      stipend: '',
      eligibility: 'Willingness to learn Linux and cloud consoles.',
      skillsRequired: 'Command line basics, Node deployment interest',
    },
  ];

  for (const seed of internshipSeeds) {
    const inv = await Internship.create({
      ...seed,
      imageUrl: '',
      youtubeUrl: '',
      postedBy: company._id,
      status: 'approved',
    });
    internships.push(inv);
  }

  // Create applications: each student applies to 2 internships => 10 applications total
  const appSeeds = [
    {
      fullName: 'Shalini R',
      email: 'shalini.r@gmail.com',
      phone: '9876543210',
      education: 'B.E Computer Science',
      qualification: 'CGPA 8.4',
      skills: 'HTML, CSS, JavaScript, React',
      resumeLink: 'https://drive.google.com/file/d/shalini_resume',
      coverLetter: 'Interested in frontend internships and eager to learn with a team.',
    },
    {
      fullName: 'Arun K',
      email: 'arun.k@gmail.com',
      phone: '9123456780',
      education: 'B.Tech Information Technology',
      qualification: 'CGPA 8.1',
      skills: 'Node.js, Express, MongoDB',
      resumeLink: 'https://drive.google.com/file/d/arun_resume',
      coverLetter: 'I have built mini full-stack apps and want real project exposure.',
    },
    {
      fullName: 'Meena S',
      email: 'meena.s@gmail.com',
      phone: '9001122334',
      education: 'B.Sc Computer Science',
      qualification: '76%',
      skills: 'Python, SQL, Data Analysis',
      resumeLink: 'https://drive.google.com/file/d/meena_resume',
      coverLetter: 'Looking for an internship to grow my data + software skills.',
    },
    {
      fullName: 'Kavin M',
      email: 'kavin.m@gmail.com',
      phone: '8899776655',
      education: 'Diploma in Computer Engineering',
      qualification: '82%',
      skills: 'Java, OOP, MySQL',
      resumeLink: 'https://drive.google.com/file/d/kavin_resume',
      coverLetter: 'Passionate about Java development and problem solving.',
    },
    {
      fullName: 'Divya P',
      email: 'divya.p@gmail.com',
      phone: '9788012345',
      education: 'B.E ECE',
      qualification: 'CGPA 8.0',
      skills: 'C, Basics of Embedded, HTML, JavaScript',
      resumeLink: 'https://drive.google.com/file/d/divya_resume',
      coverLetter: 'Want to transition into software through internships.',
    },
  ];

  const createdApps = [];
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const a = appSeeds[i];
    const inv1 = pick(internships, i * 2);
    const inv2 = pick(internships, i * 2 + 1);
    createdApps.push(
      await Application.create({ student: student._id, internshipId: inv1._id, ...a, status: 'applied' })
    );
    createdApps.push(
      await Application.create({ student: student._id, internshipId: inv2._id, ...a, status: 'applied' })
    );
  }

  console.log('Seed complete');
  console.log(`Admin: ${admin.username} / Admin@123`);
  console.log(`Company: ${company.username} / Comp@1234`);
  console.log(`Students: ${students.map((s) => s.username).join(', ')} (password: Hello123)`);
  console.log(`Internships created: ${internships.length}`);
  console.log(`Applications created: ${createdApps.length}`);

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});

