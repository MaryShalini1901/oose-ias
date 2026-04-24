const API_BASE = 'http://localhost:5000';

const pageParams = new URLSearchParams(window.location.search);
// Theme for the internship system UI:
// Default: dark.
// Optional: ?theme=light for screenshot-friendly mode.
const themeParam = pageParams.get('theme');
const isLightRequested = themeParam === 'light';
if (isLightRequested) {
  document.body.classList.add('screenshot-mode');
}

let authToken = null;
let currentUser = null;
let approvedInternshipsCache = [];

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const roleSelect = document.getElementById('role');
const authMessage = document.getElementById('authMessage');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

const authSection = document.getElementById('auth-section');
const dashboard = document.getElementById('dashboard');
const dashboardTitle = document.getElementById('dashboardTitle');
const dashboardInfo = document.getElementById('dashboardInfo');
const logoutBtn = document.getElementById('logoutBtn');
const landing = document.getElementById('landing');
const getStartedBtn = document.getElementById('getStartedBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const navAuthBtn = document.getElementById('navAuthBtn');
const navLogoutBtn = document.getElementById('navLogoutBtn');
const navUserPill = document.getElementById('navUserPill');
const navHomeBtn = document.getElementById('navHomeBtn');
const navInternshipsBtn = document.getElementById('navInternshipsBtn');
const navApplicationsBtn = document.getElementById('navApplicationsBtn');
const navNotificationsBtn = document.getElementById('navNotificationsBtn');
const statValues = document.querySelectorAll('.stat-value');

const studentPanel = document.getElementById('studentPanel');
const companyPanel = document.getElementById('companyPanel');
const adminPanel = document.getElementById('adminPanel');

// Student elements
const loadInternshipsBtn = document.getElementById('loadInternshipsBtn');
const internshipList = document.getElementById('internshipList');
const internshipSearchInput = document.getElementById('internshipSearchInput');
const loadApplicationsBtn = document.getElementById('loadApplicationsBtn');
const applicationList = document.getElementById('applicationList');
const loadNotificationsBtn = document.getElementById('loadNotificationsBtn');
const notificationList = document.getElementById('notificationList');
const applyFormCard = document.getElementById('applyFormCard');
const cancelApplyBtn = document.getElementById('cancelApplyBtn');
const applyForInfo = document.getElementById('applyForInfo');
const applyInternshipId = document.getElementById('applyInternshipId');
const applyFullName = document.getElementById('applyFullName');
const applyEmail = document.getElementById('applyEmail');
const applyPhone = document.getElementById('applyPhone');
const applyEducation = document.getElementById('applyEducation');
const applyQualification = document.getElementById('applyQualification');
const applySkills = document.getElementById('applySkills');
const applyResumeLink = document.getElementById('applyResumeLink');
const applyCoverLetter = document.getElementById('applyCoverLetter');
const submitApplyBtn = document.getElementById('submitApplyBtn');
const applyMessage = document.getElementById('applyMessage');
const studentIdValue = document.getElementById('studentIdValue');
const copyStudentIdBtn = document.getElementById('copyStudentIdBtn');

// Student internship details elements
const internshipDetailsCard = document.getElementById('internshipDetailsCard');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const detailsTitle = document.getElementById('detailsTitle');
const detailsCompany = document.getElementById('detailsCompany');
const detailsDescription = document.getElementById('detailsDescription');
const detailsImage = document.getElementById('detailsImage');
const detailsVideoLinkWrap = document.getElementById('detailsVideoLinkWrap');
const detailsVideoLink = document.getElementById('detailsVideoLink');
const detailsApplyBtn = document.getElementById('detailsApplyBtn');
const companyDetailsCard = document.getElementById('companyDetailsCard');
const closeCompanyDetailsBtn = document.getElementById('closeCompanyDetailsBtn');
const companyDetailsTitle = document.getElementById('companyDetailsTitle');
const companyDetailsCompany = document.getElementById('companyDetailsCompany');
const companyDetailsStatus = document.getElementById('companyDetailsStatus');
const companyDetailsDescription = document.getElementById('companyDetailsDescription');
const companyDetailsImage = document.getElementById('companyDetailsImage');
const companyDetailsVideoLinkWrap = document.getElementById('companyDetailsVideoLinkWrap');
const companyDetailsVideoLink = document.getElementById('companyDetailsVideoLink');

// Company elements
const internshipTitle = document.getElementById('internshipTitle');
const internshipCompany = document.getElementById('internshipCompany');
const internshipDescription = document.getElementById('internshipDescription');
const internshipImageUrl = document.getElementById('internshipImageUrl');
const internshipYoutubeUrl = document.getElementById('internshipYoutubeUrl');
const postInternshipBtn = document.getElementById('postInternshipBtn');
const companyMessage = document.getElementById('companyMessage');
const companyLoadApplicationsBtn = document.getElementById('companyLoadApplicationsBtn');
const companyApplicationList = document.getElementById('companyApplicationList');
const loadMyInternshipsBtn = document.getElementById('loadMyInternshipsBtn');
const myInternshipList = document.getElementById('myInternshipList');

function safeImage(url) {
  const u = (url || '').trim();
  if (!u) return '';
  return u;
}

function toYoutubeEmbed(url) {
  const u = (url || '').trim();
  if (!u) return '';
  // We just want a clean "watch" URL that opens in a new tab.
  try {
    const parsed = new URL(u);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
  } catch {
    // ignore parse errors
  }
  return u;
}

// Admin elements
const loadPendingInternshipsBtn = document.getElementById('loadPendingInternshipsBtn');
const pendingInternshipList = document.getElementById('pendingInternshipList');
const adminLoadApplicationsBtn = document.getElementById('adminLoadApplicationsBtn');
const adminApplicationList = document.getElementById('adminApplicationList');
const resetDemoBtn = document.getElementById('resetDemoBtn');
const notifyStudentId = document.getElementById('notifyStudentId');
const notifyMessage = document.getElementById('notifyMessage');
const sendNotifyBtn = document.getElementById('sendNotifyBtn');
const adminMessage = document.getElementById('adminMessage');
const adminTodayStatsHint = document.getElementById('adminTodayStatsHint');
const adminTodayApplied = document.getElementById('adminTodayApplied');
const adminTodayApproved = document.getElementById('adminTodayApproved');
const adminTodayRejected = document.getElementById('adminTodayRejected');
const passwordHint = document.getElementById('passwordHint');
const registerFullName = document.getElementById('registerFullName');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const filterDomain = document.getElementById('filterDomain');
const filterLocation = document.getElementById('filterLocation');
const filterDuration = document.getElementById('filterDuration');
const sortInternships = document.getElementById('sortInternships');
const detailsMeta = document.getElementById('detailsMeta');
const detailsEligibility = document.getElementById('detailsEligibility');
const detailsSkills = document.getElementById('detailsSkills');
const detailsDuration = document.getElementById('detailsDuration');
const detailsDeadline = document.getElementById('detailsDeadline');
const detailsStipend = document.getElementById('detailsStipend');
const detailsClosedNote = document.getElementById('detailsClosedNote');
const notifMasterToggle = document.getElementById('notifMasterToggle');
const internshipAlertsToggle = document.getElementById('internshipAlertsToggle');
const internshipDomain = document.getElementById('internshipDomain');
const internshipLocation = document.getElementById('internshipLocation');
const internshipDurationWeeks = document.getElementById('internshipDurationWeeks');
const internshipDeadline = document.getElementById('internshipDeadline');
const internshipStipend = document.getElementById('internshipStipend');
const internshipEligibility = document.getElementById('internshipEligibility');
const internshipSkillsRequired = document.getElementById('internshipSkillsRequired');

const notifWrap = document.getElementById('notifWrap');
const notifBellBtn = document.getElementById('notifBellBtn');
const notifBadge = document.getElementById('notifBadge');
const notifDropdown = document.getElementById('notifDropdown');
const notifDropdownList = document.getElementById('notifDropdownList');
const notifEmpty = document.getElementById('notifEmpty');
const notifMarkAllRead = document.getElementById('notifMarkAllRead');
let lastNotificationsCache = [];
let notifPollTimer = null;
let currentDetailInternship = null;

const FAQ_ITEMS = [
  {
    q: 'How do I register as a student?',
    a: 'Click Login, choose Student, fill your full name, username, and password, then Register. Add email and phone when you apply for an internship.',
  },
  {
    q: 'Why is my internship not visible yet?',
    a: 'Company postings stay Pending until an admin approves them. After approval they appear in the student list.',
  },
  {
    q: 'Can I apply twice to the same internship?',
    a: 'No. The system blocks duplicate applications from the same student account for one internship.',
  },
  {
    q: 'What password rules apply?',
    a: 'Students need at least 8 characters with letters and numbers. Company and admin accounts need stronger passwords with upper, lower, number, and a symbol.',
  },
  {
    q: 'How do notifications work?',
    a: 'Use the bell for alerts. You can turn off in-app notifications or “new internship” alerts under Notification settings.',
  },
  {
    q: 'What if the application deadline passed?',
    a: 'Closed internships hide the Apply action and the server rejects new applications after the deadline.',
  },
];

function dispLabel(label, value) {
  const v = value != null && String(value).trim() !== '' ? String(value).trim() : 'Not specified';
  return `${label}: ${v}`;
}

function isInternshipOpen(i) {
  if (!i || !i.applicationDeadline) return true;
  const d = new Date(i.applicationDeadline);
  return !Number.isNaN(d.getTime()) && d >= new Date();
}

function buildInternshipsQuery() {
  const params = new URLSearchParams();
  const q = (internshipSearchInput && internshipSearchInput.value ? internshipSearchInput.value : '').trim();
  if (q) params.set('q', q);
  const dom = filterDomain && filterDomain.value ? filterDomain.value.trim() : '';
  if (dom) params.set('domain', dom);
  const loc = filterLocation && filterLocation.value ? filterLocation.value.trim() : '';
  if (loc) params.set('location', loc);
  const dur = filterDuration && filterDuration.value ? String(filterDuration.value).trim() : '';
  if (dur) params.set('duration', dur);
  const sort = sortInternships && sortInternships.value ? sortInternships.value : 'date';
  if (sort) params.set('sort', sort);
  return params.toString() ? `?${params.toString()}` : '';
}

function openInternshipDetails(i) {
  currentDetailInternship = i;
  if (!internshipDetailsCard) return;
  detailsTitle.textContent = i.title || 'Internship';
  detailsCompany.textContent = i.company || '';
  if (detailsMeta) {
    const parts = [];
    if (i.domain) parts.push(`Domain: ${i.domain}`);
    if (i.location) parts.push(`Location: ${i.location}`);
    detailsMeta.textContent = parts.join(' · ') || '';
  }
  detailsDescription.textContent = i.description || '';
  if (detailsEligibility) detailsEligibility.textContent = dispLabel('Eligibility', i.eligibility);
  if (detailsSkills) detailsSkills.textContent = dispLabel('Skills', i.skillsRequired);
  if (detailsDuration) {
    const w = i.durationWeeks != null && i.durationWeeks !== '' ? `${i.durationWeeks} weeks` : '';
    detailsDuration.textContent = dispLabel('Duration', w);
  }
  if (detailsDeadline) {
    let dtext = '';
    if (i.applicationDeadline) {
      const d = new Date(i.applicationDeadline);
      dtext = Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
    }
    detailsDeadline.textContent = dispLabel('Application deadline', dtext);
  }
  if (detailsStipend) detailsStipend.textContent = dispLabel('Stipend', i.stipend);

  const imgUrl = safeImage(i.imageUrl);
  if (detailsImage) {
    detailsImage.src =
      imgUrl ||
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14">No image</text></svg>';
  }

  const cleaned = toYoutubeEmbed((i.youtubeUrl || '').trim());
  if (cleaned && detailsVideoLink && detailsVideoLinkWrap) {
    detailsVideoLink.href = cleaned;
    detailsVideoLinkWrap.classList.remove('hidden');
  } else if (detailsVideoLinkWrap) {
    detailsVideoLinkWrap.classList.add('hidden');
    if (detailsVideoLink) detailsVideoLink.href = '#';
  }

  const open = isInternshipOpen(i);
  if (detailsClosedNote) {
    detailsClosedNote.classList.toggle('hidden', open);
  }
  if (detailsApplyBtn) {
    detailsApplyBtn.disabled = !open;
    detailsApplyBtn.classList.toggle('secondary', !open);
  }

  internshipDetailsCard.classList.remove('hidden');
  internshipDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderFaqList(query) {
  const ul = document.getElementById('faqList');
  if (!ul) return;
  const q = (query || '').trim().toLowerCase();
  ul.innerHTML = '';
  const items = !q
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q)
      );
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No FAQs match your search. Try another word.';
    ul.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = item.q;
    const p = document.createElement('p');
    p.className = 'muted small';
    p.textContent = item.a;
    li.appendChild(strong);
    li.appendChild(p);
    ul.appendChild(li);
  });
}

function validateRegisterClient() {
  const fn = registerFullName ? String(registerFullName.value).trim() : '';
  const un = usernameInput ? String(usernameInput.value).trim() : '';

  if (!fn || fn.length < 2 || fn.length > 200 || /\d/.test(fn) || !/^[\p{L}\p{M}\s.'-]+$/u.test(fn)) {
    return {
      ok: false,
      message:
        'Full name: 2–200 characters, letters only (no numbers). Spaces and . - \' are allowed.',
    };
  }
  if (un.length < 3) {
    return { ok: false, message: 'Username must be at least 3 characters.' };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(un)) {
    return {
      ok: false,
      message: 'Username may use only letters, numbers, dot (.), underscore (_), and hyphen (-).',
    };
  }
  return { ok: true };
}

/** Mirrors backend password rules (register). */
function validatePasswordClient(password, role) {
  const p = password;
  if (typeof p !== 'string' || p.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters' };
  }
  if (p.length > 128) {
    return { ok: false, message: 'Password is too long' };
  }
  if (role === 'company' || role === 'admin') {
    if (!/[A-Z]/.test(p)) return { ok: false, message: 'Include at least one uppercase letter (A–Z)' };
    if (!/[a-z]/.test(p)) return { ok: false, message: 'Include at least one lowercase letter (a–z)' };
    if (!/[0-9]/.test(p)) return { ok: false, message: 'Include at least one digit (0–9)' };
    if (!/[^a-zA-Z0-9]/.test(p)) {
      return { ok: false, message: 'Include at least one special character (symbol, punctuation, etc.)' };
    }
  } else {
    if (!/[a-zA-Z]/.test(p)) return { ok: false, message: 'Include at least one letter' };
    if (!/[0-9]/.test(p)) return { ok: false, message: 'Include at least one number' };
  }
  const u = (usernameInput && usernameInput.value) ? String(usernameInput.value).trim() : '';
  if (u && p.toLowerCase() === u.toLowerCase()) {
    return { ok: false, message: 'Password must not be the same as your username' };
  }
  return { ok: true };
}

function updatePasswordHint() {
  if (!passwordHint || !roleSelect) return;
  const r = roleSelect.value;
  if (r === 'student') {
    passwordHint.textContent =
      'Student: min 8 characters, at least one letter and one number. Password must not match your username.';
  } else {
    passwordHint.textContent =
      'Company / Admin: min 8 characters, uppercase, lowercase, number, and a special character. Password must not match username. (You may use the same password as a student account for lab/demo.)';
  }
}

if (roleSelect) {
  roleSelect.addEventListener('change', updatePasswordHint);
  updatePasswordHint();
}

function setAuth(token, user) {
  authToken = token;
  currentUser = user;
  if (!token) {
    localStorage.removeItem('ias_token');
    localStorage.removeItem('ias_user');
  } else {
    localStorage.setItem('ias_token', token);
    localStorage.setItem('ias_user', JSON.stringify(user));
  }
  updateUIForAuth();
}

function stopNotificationPolling() {
  if (notifPollTimer) {
    clearInterval(notifPollTimer);
    notifPollTimer = null;
  }
}

function startNotificationPolling() {
  stopNotificationPolling();
  if (!authToken) return;
  refreshNotifications();
  notifPollTimer = setInterval(refreshNotifications, 15000);
}

async function refreshNotifications() {
  if (!authToken) return;
  try {
    const notes = await apiRequest('/notifications');
    lastNotificationsCache = Array.isArray(notes) ? notes : [];
    const unread = lastNotificationsCache.filter((n) => !n.read).length;
    if (notifBadge) {
      if (unread > 0) {
        notifBadge.textContent = unread > 99 ? '99+' : String(unread);
        notifBadge.classList.remove('hidden');
      } else {
        notifBadge.classList.add('hidden');
      }
    }
    if (notifDropdown && !notifDropdown.classList.contains('hidden')) {
      renderNotifDropdownList(lastNotificationsCache);
    }
  } catch (err) {
    console.warn('Notifications', err);
  }
}

function renderNotifDropdownList(notes) {
  if (!notifDropdownList || !notifEmpty) return;
  notifDropdownList.innerHTML = '';
  if (!notes || notes.length === 0) {
    notifEmpty.classList.remove('hidden');
    return;
  }
  notifEmpty.classList.add('hidden');
  notes.forEach((n) => {
    const li = document.createElement('li');
    li.className = 'notif-item';
    if (!n.read) li.classList.add('notif-item--unread');
    const msg = n.message || '';
    const low = msg.toLowerCase();
    if (low.includes('approved')) li.classList.add('notif-item--approved');
    else if (low.includes('rejected')) li.classList.add('notif-item--rejected');

    const time = document.createElement('div');
    time.className = 'notif-item-time';
    time.textContent = new Date(n.createdAt).toLocaleString();

    const body = document.createElement('div');
    body.className = 'notif-item-body';
    body.textContent = msg;

    li.appendChild(time);
    li.appendChild(body);
    li.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      if (!n.read) {
        try {
          await apiRequest(`/notifications/${n._id}/read`, { method: 'PATCH', body: '{}' });
          await refreshNotifications();
          renderNotifDropdownList(lastNotificationsCache);
        } catch (e) {
          alert(e.message);
        }
      }
    });
    notifDropdownList.appendChild(li);
  });
}

function updateUIForAuth() {
  if (authToken && currentUser) {
    landing.classList.add('hidden');
    authSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    dashboardTitle.textContent = `${currentUser.role.toUpperCase()} Dashboard`;
    dashboardInfo.textContent = `Logged in as ${currentUser.username}`;
    navUserPill.textContent = `${currentUser.username} (${currentUser.role})`;
    navUserPill.classList.remove('hidden');
    navAuthBtn.classList.add('hidden');
    navLogoutBtn.classList.remove('hidden');
    if (navHomeBtn) navHomeBtn.classList.remove('hidden');
    if (navInternshipsBtn) navInternshipsBtn.classList.remove('hidden');
    if (navApplicationsBtn) navApplicationsBtn.classList.remove('hidden');
    if (navNotificationsBtn) navNotificationsBtn.classList.remove('hidden');
    if (notifWrap) notifWrap.classList.remove('hidden');
    startNotificationPolling();
    studentPanel.classList.add('hidden');
    companyPanel.classList.add('hidden');
    adminPanel.classList.add('hidden');
    if (currentUser.role === 'student') studentPanel.classList.remove('hidden');
    if (currentUser.role === 'company') {
      companyPanel.classList.remove('hidden');
      // Auto-load posted internships so the section always "opens"
      if (typeof loadMyInternshipsBtn !== 'undefined' && loadMyInternshipsBtn) {
        setTimeout(() => loadMyInternshipsBtn.click(), 0);
      }
    }
    if (currentUser.role === 'admin') {
      adminPanel.classList.remove('hidden');
      refreshAdminTodayStats();
    }

    if (currentUser.role === 'student' && studentIdValue) {
      studentIdValue.textContent = currentUser.id || '';
    }

    if (currentUser.role === 'student') {
      if (notifMasterToggle) {
        notifMasterToggle.checked = currentUser.notificationsEnabled !== false;
      }
      if (internshipAlertsToggle) {
        internshipAlertsToggle.checked = currentUser.internshipAlerts !== false;
      }
    }

    if (currentUser.role === 'student') {
      // Auto-load approved internships on login
      if (loadInternshipsBtn) {
        setTimeout(() => loadInternshipsBtn.click(), 0);
      }
    }
  } else {
    stopNotificationPolling();
    if (notifWrap) notifWrap.classList.add('hidden');
    if (notifDropdown) notifDropdown.classList.add('hidden');
    if (notifBadge) notifBadge.classList.add('hidden');
    lastNotificationsCache = [];
    landing.classList.remove('hidden');
    authSection.classList.add('hidden'); // show only when user clicks Login/Register
    dashboard.classList.add('hidden');
    navUserPill.classList.add('hidden');
    navAuthBtn.classList.remove('hidden');
    navLogoutBtn.classList.add('hidden');
    if (navHomeBtn) navHomeBtn.classList.add('hidden');
    if (navInternshipsBtn) navInternshipsBtn.classList.add('hidden');
    if (navApplicationsBtn) navApplicationsBtn.classList.add('hidden');
    if (navNotificationsBtn) navNotificationsBtn.classList.add('hidden');
  }
}

function showAuth() {
  authSection.classList.remove('hidden');
  authSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function smoothScrollTo(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadStudentProfileDraft() {
  if (!currentUser || currentUser.role !== 'student') return null;
  try {
    const raw = localStorage.getItem(`ias_student_profile_${currentUser.username}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStudentProfileDraft() {
  if (!currentUser || currentUser.role !== 'student') return;
  const data = {
    fullName: applyFullName ? applyFullName.value : '',
    email: applyEmail ? applyEmail.value : '',
    phone: applyPhone ? applyPhone.value : '',
    education: applyEducation ? applyEducation.value : '',
    qualification: applyQualification ? applyQualification.value : '',
    skills: applySkills ? applySkills.value : '',
    resumeLink: applyResumeLink ? applyResumeLink.value : '',
  };
  localStorage.setItem(`ias_student_profile_${currentUser.username}`, JSON.stringify(data));
}

function focusRoleSection(section) {
  if (!currentUser) return;
  if (currentUser.role === 'student') {
    if (section === 'internships') smoothScrollTo(loadInternshipsBtn);
    if (section === 'applications') smoothScrollTo(loadApplicationsBtn);
    if (section === 'notifications') smoothScrollTo(loadNotificationsBtn);
  } else if (currentUser.role === 'company') {
    if (section === 'internships') smoothScrollTo(postInternshipBtn);
    if (section === 'applications') smoothScrollTo(companyLoadApplicationsBtn);
    if (section === 'notifications') {
      if (notifBellBtn) notifBellBtn.click();
    }
  } else if (currentUser.role === 'admin') {
    if (section === 'internships') smoothScrollTo(loadPendingInternshipsBtn);
    if (section === 'applications') smoothScrollTo(adminLoadApplicationsBtn);
    if (section === 'notifications') {
      if (notifBellBtn) notifBellBtn.click();
    }
  }
}

function openApplyFormForInternship(i) {
  applyMessage.textContent = '';
  applyMessage.classList.remove('success');
  applyForInfo.textContent = `Applying for: ${i.title} @ ${i.company}`;
  applyInternshipId.value = i._id;
  const draft = loadStudentProfileDraft();
  if (draft) {
    if (applyFullName && !applyFullName.value) applyFullName.value = draft.fullName || '';
    if (applyEmail && !applyEmail.value) applyEmail.value = draft.email || '';
    if (applyPhone && !applyPhone.value) applyPhone.value = draft.phone || '';
    if (applyEducation && !applyEducation.value) applyEducation.value = draft.education || '';
    if (applyQualification && !applyQualification.value) applyQualification.value = draft.qualification || '';
    if (applySkills && !applySkills.value) applySkills.value = draft.skills || '';
    if (applyResumeLink && !applyResumeLink.value) applyResumeLink.value = draft.resumeLink || '';
  } else if (applyFullName && !applyFullName.value) {
    const fromProfile = currentUser && currentUser.fullName ? currentUser.fullName : '';
    applyFullName.value = fromProfile || (currentUser && currentUser.username ? currentUser.username : '');
    if (applyEmail && !applyEmail.value && currentUser && currentUser.email) {
      applyEmail.value = currentUser.email;
    }
    if (applyPhone && !applyPhone.value && currentUser && currentUser.phone) {
      applyPhone.value = currentUser.phone;
    }
  }
  applyFormCard.classList.remove('hidden');
  applyFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderApprovedInternships(list) {
  internshipList.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    const li = document.createElement('li');
    li.textContent =
      'No internships match your search or filters. Try different keywords or clear filters — only open, approved postings are listed.';
    internshipList.appendChild(li);
    return;
  }

  list.forEach((i) => {
    const li = document.createElement('li');
    li.className = 'internship-item';

    const img = document.createElement('img');
    img.className = 'internship-thumb';
    const imgUrl = safeImage(i.imageUrl);
    img.src =
      imgUrl ||
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="104"><rect width="140" height="104" fill="%23e5e7eb"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="12">No image</text></svg>';
    img.alt = 'Internship image';

    const meta = document.createElement('div');
    meta.className = 'internship-meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = i.title;
    const sub = document.createElement('div');
    sub.className = 'sub';
    const bits = [i.company, i.domain, i.location].filter(Boolean);
    sub.textContent = bits.join(' · ') || i.company || '';
    meta.appendChild(title);
    meta.appendChild(sub);

    const actions = document.createElement('div');
    actions.className = 'internship-actions';

    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'secondary small';
    detailsBtn.textContent = 'View Details';
    detailsBtn.addEventListener('click', () => openInternshipDetails(i));

    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply';
    const open = isInternshipOpen(i);
    if (!open) {
      applyBtn.disabled = true;
      applyBtn.classList.add('secondary');
      applyBtn.title = 'Applications closed';
    }
    applyBtn.addEventListener('click', () => {
      if (!isInternshipOpen(i)) return;
      openApplyFormForInternship(i);
    });

    actions.appendChild(detailsBtn);
    actions.appendChild(applyBtn);

    li.appendChild(img);
    li.appendChild(meta);
    li.appendChild(actions);
    internshipList.appendChild(li);
  });
}

if (copyStudentIdBtn) {
  copyStudentIdBtn.addEventListener('click', async () => {
    const id = (currentUser && currentUser.id) || '';
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      alert('Student ID copied');
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  });
}

async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (e) {
    throw new Error(`Cannot reach backend (${API_BASE}). Please start the server (npm start).`);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const msg =
      (data && data.message) ||
      `${res.status} ${res.statusText} (${path})` +
        (isJson ? '' : ' - Backend returned non-JSON response (maybe route not found or server error).');
    throw new Error(msg);
  }
  return data;
}

async function refreshAdminTodayStats() {
  if (!currentUser || currentUser.role !== 'admin') return;
  if (!adminTodayApplied || !adminTodayApproved || !adminTodayRejected) return;
  try {
    const s = await apiRequest('/admin/application-stats-today');
    adminTodayApplied.textContent = String(s.appliedToday);
    adminTodayApproved.textContent = String(s.approvedToday);
    adminTodayRejected.textContent = String(s.rejectedToday);
    if (adminTodayStatsHint && s.date) {
      adminTodayStatsHint.textContent = `Counts use the server calendar date: ${s.date} (your PC may differ if time zones mismatch).`;
    }
  } catch {
    adminTodayApplied.textContent = '—';
    adminTodayApproved.textContent = '—';
    adminTodayRejected.textContent = '—';
    if (adminTodayStatsHint) adminTodayStatsHint.textContent = '';
  }
}

async function withButtonLoading(btn, label, action) {
  if (!btn) return action();
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = label || 'Loading...';
  try {
    return await action();
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
}

loginBtn.addEventListener('click', async () => {
  authMessage.textContent = '';
  const u = usernameInput ? String(usernameInput.value).trim() : '';
  const p = passwordInput ? passwordInput.value : '';
  if (!u || !p) {
    authMessage.textContent = 'Please enter both username and password.';
    return;
  }
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: u,
        password: p,
      }),
    });
    setAuth(data.token, data.user);
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

registerBtn.addEventListener('click', async () => {
  authMessage.textContent = '';
  authMessage.classList.remove('success');
  const regCheck = validateRegisterClient();
  if (!regCheck.ok) {
    authMessage.textContent = regCheck.message;
    return;
  }
  const check = validatePasswordClient(passwordInput.value, roleSelect.value);
  if (!check.ok) {
    authMessage.textContent = check.message;
    return;
  }
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        role: roleSelect.value,
        fullName: registerFullName ? registerFullName.value.trim() : '',
        email: '',
        phone: '',
      }),
    });
    setAuth(data.token, data.user);
    if (data.message) {
      authMessage.textContent = data.message;
      authMessage.classList.add('success');
    }
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

if (forgotPasswordBtn) {
  forgotPasswordBtn.addEventListener('click', () => {
    alert(
      'Password recovery: contact your system administrator or course staff to reset your account. Demo admins can create a new user or update MongoDB directly.'
    );
  });
}

function animateStats() {
  if (!statValues || statValues.length === 0) return;
  statValues.forEach((el) => {
    const target = Number(el.getAttribute('data-target') || '0');
    const isPercent = String(el.textContent).includes('%');
    let current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) current = target;
      el.textContent = isPercent ? `${current}%` : `${current}K+`;
      if (current === target) clearInterval(timer);
    }, 20);
  });
}

logoutBtn.addEventListener('click', () => {
  setAuth(null, null);
});

navLogoutBtn.addEventListener('click', () => {
  setAuth(null, null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

navAuthBtn.addEventListener('click', () => {
  showAuth();
});

if (navHomeBtn) {
  navHomeBtn.addEventListener('click', () => smoothScrollTo(dashboard));
}
if (navInternshipsBtn) {
  navInternshipsBtn.addEventListener('click', () => focusRoleSection('internships'));
}
if (navApplicationsBtn) {
  navApplicationsBtn.addEventListener('click', () => focusRoleSection('applications'));
}
if (navNotificationsBtn) {
  navNotificationsBtn.addEventListener('click', () => focusRoleSection('notifications'));
}

if (dashboard) {
  dashboard.addEventListener('click', (e) => {
    const card = e.target && e.target.closest ? e.target.closest('.feature-card') : null;
    if (!card) return;
    const feature = card.getAttribute('data-feature');
    if (!feature) return;
    if (feature === 'internships') {
      if (currentUser && currentUser.role === 'student') loadInternshipsBtn.click();
      smoothScrollTo(currentUser && currentUser.role === 'student' ? loadInternshipsBtn : postInternshipBtn);
      return;
    }
    if (feature === 'applications') {
      if (currentUser && currentUser.role === 'student') loadApplicationsBtn.click();
      if (currentUser && currentUser.role === 'company') companyLoadApplicationsBtn.click();
      if (currentUser && currentUser.role === 'admin') adminLoadApplicationsBtn.click();
      focusRoleSection('applications');
      return;
    }
    if (feature === 'notifications') {
      if (currentUser && currentUser.role === 'student') loadNotificationsBtn.click();
      focusRoleSection('notifications');
      return;
    }
    if (feature === 'post-internship') {
      smoothScrollTo(postInternshipBtn);
      return;
    }
    if (feature === 'manage-listings') {
      loadMyInternshipsBtn.click();
      smoothScrollTo(loadMyInternshipsBtn);
      return;
    }
    if (feature === 'pending-internships' || feature === 'approve-reject') {
      loadPendingInternshipsBtn.click();
      adminLoadApplicationsBtn.click();
      smoothScrollTo(loadPendingInternshipsBtn);
      return;
    }
    if (feature === 'send-notifications') {
      smoothScrollTo(sendNotifyBtn);
    }
  });
}

if (notifBellBtn && notifDropdown) {
  notifBellBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (notifDropdown.classList.contains('hidden')) {
      await refreshNotifications();
      renderNotifDropdownList(lastNotificationsCache);
      notifDropdown.classList.remove('hidden');
    } else {
      notifDropdown.classList.add('hidden');
    }
  });
}

if (notifDropdown) {
  notifDropdown.addEventListener('click', (e) => e.stopPropagation());
}

if (notifMarkAllRead) {
  notifMarkAllRead.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await apiRequest('/notifications/read-all', { method: 'POST', body: '{}' });
      await refreshNotifications();
      renderNotifDropdownList(lastNotificationsCache);
    } catch (err) {
      alert(err.message);
    }
  });
}

document.addEventListener('click', (e) => {
  if (!notifWrap || notifWrap.classList.contains('hidden')) return;
  if (notifWrap.contains(e.target)) return;
  if (notifDropdown) notifDropdown.classList.add('hidden');
});

getStartedBtn.addEventListener('click', () => {
  showAuth();
});

learnMoreBtn.addEventListener('click', () => {
  const sec = document.getElementById('awarenessSection');
  if (sec) {
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Student actions
loadInternshipsBtn.addEventListener('click', async () => {
  await withButtonLoading(loadInternshipsBtn, 'Loading...', async () => {
    try {
      const query = buildInternshipsQuery();
      const internships = await apiRequest(`/internships${query}`);
      approvedInternshipsCache = Array.isArray(internships) ? internships : [];
      renderApprovedInternships(approvedInternshipsCache);
    } catch (err) {
      alert(err.message);
    }
  });
});

let internshipSearchDebounce = null;
if (internshipSearchInput) {
  internshipSearchInput.addEventListener('input', () => {
    clearTimeout(internshipSearchDebounce);
    internshipSearchDebounce = setTimeout(() => {
      if (loadInternshipsBtn) loadInternshipsBtn.click();
    }, 450);
  });
}
[filterDomain, filterLocation, filterDuration, sortInternships].forEach((el) => {
  if (!el) return;
  el.addEventListener('change', () => {
    if (loadInternshipsBtn) loadInternshipsBtn.click();
  });
});

closeDetailsBtn.addEventListener('click', () => {
  internshipDetailsCard.classList.add('hidden');
  if (detailsVideoLink) {
    detailsVideoLink.href = '#';
  }
});

if (detailsApplyBtn) {
  detailsApplyBtn.addEventListener('click', () => {
    if (!currentDetailInternship || !isInternshipOpen(currentDetailInternship)) return;
    openApplyFormForInternship(currentDetailInternship);
    internshipDetailsCard.classList.add('hidden');
  });
}

if (closeCompanyDetailsBtn) {
  closeCompanyDetailsBtn.addEventListener('click', () => {
    companyDetailsCard.classList.add('hidden');
    if (companyDetailsVideoLink) {
      companyDetailsVideoLink.href = '#';
    }
  });
}

cancelApplyBtn.addEventListener('click', () => {
  applyFormCard.classList.add('hidden');
});

function validateApplyFormClient() {
  const fullName = String(applyFullName ? applyFullName.value : '').trim();
  const email = String(applyEmail ? applyEmail.value : '').trim();
  const phone = String(applyPhone ? applyPhone.value : '').trim();
  if (!fullName || !email || !phone) {
    return { ok: false, message: 'Full name, email, and phone are required.' };
  }
  if (
    fullName.length < 2 ||
    fullName.length > 200 ||
    /\d/.test(fullName) ||
    !/^[\p{L}\p{M}\s.'-]+$/u.test(fullName)
  ) {
    return {
      ok: false,
      message:
        'Full name: 2–200 characters, letters only (no numbers). Spaces and . - \' are allowed.',
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, message: 'Enter a valid email address.' };
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) {
    return { ok: false, message: 'Phone must contain exactly 10 digits.' };
  }
  const res = String(applyResumeLink ? applyResumeLink.value : '').trim();
  if (res) {
    if (res.length > 2048) {
      return { ok: false, message: 'Resume link is too long (max 2048 characters).' };
    }
    try {
      const u = new URL(res);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, message: 'Resume link must start with http or https.' };
      }
    } catch {
      return { ok: false, message: 'Resume link must be a valid URL.' };
    }
  }
  return { ok: true };
}

submitApplyBtn.addEventListener('click', async () => {
  applyMessage.textContent = '';
  const pre = validateApplyFormClient();
  if (!pre.ok) {
    applyMessage.textContent = pre.message;
    applyMessage.classList.remove('success');
    return;
  }
  await withButtonLoading(submitApplyBtn, 'Submitting...', async () => {
    try {
      await apiRequest('/apply', {
        method: 'POST',
        body: JSON.stringify({
          internshipId: applyInternshipId.value,
          fullName: applyFullName.value,
          email: applyEmail.value,
          phone: applyPhone.value,
          education: applyEducation ? applyEducation.value : '',
          qualification: applyQualification ? applyQualification.value : '',
          skills: applySkills.value,
          resumeLink: applyResumeLink.value,
          coverLetter: applyCoverLetter.value,
        }),
      });
      applyMessage.textContent = 'Application submitted successfully.';
      applyMessage.classList.add('success');
      saveStudentProfileDraft();
      applyFormCard.classList.add('hidden');
      refreshNotifications();
    } catch (err) {
      applyMessage.textContent = err.message;
      applyMessage.classList.remove('success');
    }
  });
});

function internshipTitleSafe(a) {
  return a.internshipId && a.internshipId.title ? a.internshipId.title : '(Internship removed or missing)';
}

function renderCompanyOrAdminApplications(ul, apps, emptyHint) {
  ul.innerHTML = '';
  if (!Array.isArray(apps) || apps.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = emptyHint || 'No applications found.';
    ul.appendChild(li);
    return;
  }
  apps.forEach((a) => {
    const li = document.createElement('li');
    li.className = 'application-row';

    const head = document.createElement('div');
    head.className = 'application-head';
    const stu = a.student && a.student.username ? a.student.username : 'Student';
    head.textContent = `${stu} → ${internshipTitleSafe(a)} — ${a.status || 'applied'}`;

    const detail = document.createElement('div');
    detail.className = 'application-detail muted small';
    detail.innerHTML = [
      `<div><b>Name:</b> ${a.fullName || '—'}</div>`,
      `<div><b>Email:</b> ${a.email || '—'}</div>`,
      `<div><b>Phone:</b> ${a.phone || '—'}</div>`,
      a.education ? `<div><b>Education:</b> ${String(a.education)}</div>` : '',
      a.qualification ? `<div><b>Qualification:</b> ${String(a.qualification)}</div>` : '',
      a.skills ? `<div><b>Skills:</b> ${String(a.skills)}</div>` : '',
      a.resumeLink ? `<div><b>Resume:</b> <a href="${String(a.resumeLink)}" target="_blank" rel="noopener">link</a></div>` : '',
      a.coverLetter ? `<div><b>Cover letter:</b> ${String(a.coverLetter)}</div>` : '',
    ]
      .filter(Boolean)
      .join('');

    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const approveBtn = document.createElement('button');
    approveBtn.textContent = 'Approve';
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'secondary small';
    rejectBtn.textContent = 'Reject';
    approveBtn.addEventListener('click', () => updateApplicationStatus(a._id, 'approved'));
    rejectBtn.addEventListener('click', () => updateApplicationStatus(a._id, 'rejected'));
    actions.appendChild(approveBtn);
    actions.appendChild(rejectBtn);

    li.appendChild(head);
    li.appendChild(detail);
    li.appendChild(actions);
    ul.appendChild(li);
  });
}

loadApplicationsBtn.addEventListener('click', async () => {
  applicationList.innerHTML = '';
  await withButtonLoading(loadApplicationsBtn, 'Loading...', async () => {
    try {
      const apps = await apiRequest('/applications');
      apps.forEach((a) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        const status = (a.status || 'applied').toLowerCase();
        span.innerHTML = `${internshipTitleSafe(a)} <span class="status-badge ${status}">${status}</span>`;
        li.appendChild(span);
        applicationList.appendChild(li);
      });
    } catch (err) {
      alert(err.message);
    }
  });
});

loadNotificationsBtn.addEventListener('click', async () => {
  notificationList.innerHTML = '';
  await withButtonLoading(loadNotificationsBtn, 'Loading...', async () => {
    try {
      await refreshNotifications();
      const notes = lastNotificationsCache;
      notes.forEach((n) => {
        const li = document.createElement('li');
        li.className = 'notif-item';
        const low = (n.message || '').toLowerCase();
        if (low.includes('approved')) li.classList.add('notif-item--approved');
        else if (low.includes('rejected')) li.classList.add('notif-item--rejected');
        li.textContent = `${new Date(n.createdAt).toLocaleString()}: ${n.message}`;
        notificationList.appendChild(li);
      });
    } catch (err) {
      alert(err.message);
    }
  });
});

// Company actions
postInternshipBtn.addEventListener('click', async () => {
  companyMessage.textContent = '';
  await withButtonLoading(postInternshipBtn, 'Posting...', async () => {
    try {
      let applicationDeadline = null;
      if (internshipDeadline && internshipDeadline.value) {
        const d = new Date(`${internshipDeadline.value}T23:59:59`);
        if (!Number.isNaN(d.getTime())) applicationDeadline = d.toISOString();
      }
      const weeksRaw = internshipDurationWeeks && internshipDurationWeeks.value;
      const durationWeeks =
        weeksRaw != null && String(weeksRaw).trim() !== '' ? Number(weeksRaw) : null;
      await apiRequest('/internships', {
        method: 'POST',
        body: JSON.stringify({
          title: internshipTitle.value,
          company: internshipCompany.value,
          description: internshipDescription.value,
          imageUrl: internshipImageUrl.value,
          youtubeUrl: internshipYoutubeUrl.value,
          domain: internshipDomain ? internshipDomain.value : '',
          location: internshipLocation ? internshipLocation.value : '',
          durationWeeks: durationWeeks != null && !Number.isNaN(durationWeeks) ? durationWeeks : null,
          applicationDeadline,
          stipend: internshipStipend ? internshipStipend.value : '',
          eligibility: internshipEligibility ? internshipEligibility.value : '',
          skillsRequired: internshipSkillsRequired ? internshipSkillsRequired.value : '',
        }),
      });
      companyMessage.textContent = 'Internship posted (awaiting admin approval).';
      companyMessage.classList.add('success');
      internshipTitle.value = '';
      internshipCompany.value = '';
      internshipDescription.value = '';
      internshipImageUrl.value = '';
      internshipYoutubeUrl.value = '';
      if (internshipDomain) internshipDomain.value = '';
      if (internshipLocation) internshipLocation.value = '';
      if (internshipDurationWeeks) internshipDurationWeeks.value = '';
      if (internshipDeadline) internshipDeadline.value = '';
      if (internshipStipend) internshipStipend.value = '';
      if (internshipEligibility) internshipEligibility.value = '';
      if (internshipSkillsRequired) internshipSkillsRequired.value = '';
    } catch (err) {
      companyMessage.textContent = err.message;
      companyMessage.classList.remove('success');
    }
  });
});

loadMyInternshipsBtn.addEventListener('click', async () => {
  myInternshipList.innerHTML = '';
  await withButtonLoading(loadMyInternshipsBtn, 'Loading...', async () => {
    try {
      const internships = await apiRequest('/internships/mine');
    if (!Array.isArray(internships) || internships.length === 0) {
      const li = document.createElement('li');
      li.textContent =
        'No posted internships found for this company account. If you posted before, login with the same company username.';
      myInternshipList.appendChild(li);
      return;
    }
      internships.forEach((i) => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${i.title} @ ${i.company} — ${i.status}`;

      const viewBtn = document.createElement('button');
      viewBtn.className = 'secondary small';
      viewBtn.textContent = 'View';
      viewBtn.addEventListener('click', () => {
        if (!companyDetailsCard) return;
        companyDetailsTitle.textContent = i.title;
        companyDetailsCompany.textContent = `Company: ${i.company}`;
        companyDetailsStatus.textContent = `Status: ${i.status}`;
        companyDetailsDescription.textContent = i.description || '';

        const imgUrl = safeImage(i.imageUrl);
        companyDetailsImage.src =
          imgUrl ||
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="104"><rect width="140" height="104" fill="%23e5e7eb"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="12">No image</text></svg>';

        const embed = toYoutubeEmbed(i.youtubeUrl);
        if (embed) {
          companyDetailsVideoLink.href = embed;
          companyDetailsVideoLinkWrap.classList.remove('hidden');
        } else {
          companyDetailsVideoLink.href = '#';
          companyDetailsVideoLinkWrap.classList.add('hidden');
        }

        companyDetailsCard.classList.remove('hidden');
        companyDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      const updateBtn = document.createElement('button');
      updateBtn.textContent = 'Edit';
      updateBtn.addEventListener('click', async () => {
        const newTitle = prompt('New title (leave blank to keep):', i.title) ?? i.title;
        const newCompany = prompt('New company (leave blank to keep):', i.company) ?? i.company;
        const newDesc = prompt('New description (leave blank to keep):', i.description) ?? i.description;
        const newImageUrl = prompt('New image URL (leave blank to keep):', i.imageUrl || '') ?? (i.imageUrl || '');
        const newYoutubeUrl =
          prompt('New YouTube URL (leave blank to keep):', i.youtubeUrl || '') ?? (i.youtubeUrl || '');
        try {
          await apiRequest(`/internships/${i._id}/update`, {
            method: 'PUT',
            body: JSON.stringify({
              title: newTitle,
              company: newCompany,
              description: newDesc,
              imageUrl: newImageUrl,
              youtubeUrl: newYoutubeUrl,
            }),
          });
          alert('Updated (status set to pending for admin verification).');
        } catch (err) {
          alert(err.message);
        }
      });

      li.appendChild(span);
      li.appendChild(viewBtn);
      li.appendChild(updateBtn);
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'secondary small';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this internship posting?')) return;
        try {
          await apiRequest(`/internships/${i._id}`, { method: 'DELETE' });
          alert('Deleted');
          loadMyInternshipsBtn.click();
        } catch (err) {
          alert(err.message);
        }
      });
      li.appendChild(deleteBtn);
        myInternshipList.appendChild(li);
      });
    } catch (err) {
      alert(err.message);
    }
  });
});

companyLoadApplicationsBtn.addEventListener('click', async () => {
  await withButtonLoading(companyLoadApplicationsBtn, 'Loading...', async () => {
    try {
      const apps = await apiRequest('/applications');
      renderCompanyOrAdminApplications(
        companyApplicationList,
        apps,
        'No applications for your postings. Post internships from this company account (same login) so applications link to you. Old postings without poster may need the same company name as your username, or repost the internship.'
      );
    } catch (err) {
      alert(err.message);
    }
  });
});

adminLoadApplicationsBtn.addEventListener('click', async () => {
  await withButtonLoading(adminLoadApplicationsBtn, 'Loading...', async () => {
    try {
      const apps = await apiRequest('/applications');
      renderCompanyOrAdminApplications(
        adminApplicationList,
        apps,
        'No applications in the system yet.'
      );
      refreshAdminTodayStats();
    } catch (err) {
      alert(err.message);
    }
  });
});

async function updateApplicationStatus(id, status) {
  try {
    let reason = '';
    if (status === 'rejected') {
      reason = (prompt('Enter rejection reason (required):') || '').trim();
      if (!reason) {
        alert('Rejection reason is required.');
        return;
      }
    }
    await apiRequest(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    alert(`Application ${status}`);
    if (currentUser && currentUser.role === 'company') {
      companyLoadApplicationsBtn.click();
    } else if (currentUser && currentUser.role === 'admin') {
      adminLoadApplicationsBtn.click();
    }
    refreshNotifications();
  } catch (err) {
    alert(err.message);
  }
}

// Admin actions
loadPendingInternshipsBtn.addEventListener('click', async () => {
  pendingInternshipList.innerHTML = '';
  await withButtonLoading(loadPendingInternshipsBtn, 'Loading...', async () => {
    try {
      const pending = await apiRequest('/admin/verify');
      if (!Array.isArray(pending) || pending.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No pending postings right now.';
        pendingInternshipList.appendChild(li);
        return;
      }
      pending.forEach((i) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        const desc = (i.description || '').trim();
        span.textContent = desc
          ? `${i.title} @ ${i.company} — ${desc}`
          : `${i.title} @ ${i.company}`;
        const approveBtn = document.createElement('button');
        approveBtn.textContent = 'Verify (Approve)';
        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Verify (Reject)';

        approveBtn.addEventListener('click', async () => {
          await apiRequest('/admin/approve', {
            method: 'POST',
            body: JSON.stringify({ internshipId: i._id }),
          });
          alert('Posting verified and approved');
          loadPendingInternshipsBtn.click();
        });

        rejectBtn.addEventListener('click', async () => {
          const reason = (prompt('Enter rejection reason (required):') || '').trim();
          if (!reason) {
            alert('Rejection reason is required.');
            return;
          }
          await apiRequest('/admin/reject', {
            method: 'POST',
            body: JSON.stringify({ internshipId: i._id, reason }),
          });
          alert('Posting verified and rejected');
          loadPendingInternshipsBtn.click();
        });

        li.appendChild(span);
        li.appendChild(approveBtn);
        li.appendChild(rejectBtn);
        pendingInternshipList.appendChild(li);
      });
    } catch (err) {
      alert(err.message);
    }
  });
});

sendNotifyBtn.addEventListener('click', async () => {
  adminMessage.textContent = '';
  try {
    await apiRequest('/admin/notify', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: notifyStudentId.value,
        message: notifyMessage.value,
      }),
    });
    adminMessage.textContent = 'Notification sent.';
    adminMessage.classList.add('success');
  } catch (err) {
    adminMessage.textContent = err.message;
    adminMessage.classList.remove('success');
  }
});

if (resetDemoBtn) {
  resetDemoBtn.addEventListener('click', async () => {
    if (!confirm('Reset demo data? This will DELETE applications + notifications only (internships will stay).')) return;
    try {
      await apiRequest('/admin/reset-demo', {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      });
      // refresh UI
      if (adminLoadApplicationsBtn) adminLoadApplicationsBtn.click();
      if (companyLoadApplicationsBtn) companyLoadApplicationsBtn.click();
      refreshNotifications();
      alert('Demo reset done.');
    } catch (err) {
      alert(err.message);
    }
  });
}

// Restore session if present
async function persistNotifSettings(partial) {
  if (!authToken || !currentUser) return;
  try {
    const data = await apiRequest('/auth/me/notifications', {
      method: 'PATCH',
      body: JSON.stringify(partial),
    });
    if (data.user) {
      currentUser = { ...currentUser, ...data.user };
      localStorage.setItem('ias_user', JSON.stringify(currentUser));
      await refreshNotifications();
    }
  } catch (e) {
    alert(e.message);
  }
}

if (notifMasterToggle) {
  notifMasterToggle.addEventListener('change', () => {
    persistNotifSettings({ notificationsEnabled: notifMasterToggle.checked });
  });
}
if (internshipAlertsToggle) {
  internshipAlertsToggle.addEventListener('change', () => {
    persistNotifSettings({ internshipAlerts: internshipAlertsToggle.checked });
  });
}

(function init() {
  renderFaqList('');
  const faqIn = document.getElementById('faqSearchInput');
  if (faqIn) {
    faqIn.addEventListener('input', () => renderFaqList(faqIn.value));
  }

  const storedToken = localStorage.getItem('ias_token');
  const storedUser = localStorage.getItem('ias_user');
  if (storedToken && storedUser) {
    authToken = storedToken;
    currentUser = JSON.parse(storedUser);
  }
  updateUIForAuth();
  animateStats();
})();

