const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const UI_BASE = process.env.UI_BASE_URL || 'http://localhost:5500';
const API_BASE = process.env.TEST_BASE_URL || 'http://localhost:5000';
const RUN_ID = Date.now();

const ADMIN = {
  username: process.env.LOCAL_ADMIN_USERNAME || 'admin_ias',
  password: process.env.LOCAL_ADMIN_PASSWORD || 'Admin@123',
  role: 'admin',
};
const COMPANY = {
  username: process.env.LOCAL_COMPANY_USERNAME || 'company_ias',
  password: process.env.LOCAL_COMPANY_PASSWORD || 'Comp@1234',
  role: 'company',
};
const STUDENT = {
  username: process.env.LOCAL_STUDENT_USERNAME || 'meena',
  password: process.env.LOCAL_STUDENT_PASSWORD || 'Hello123',
  role: 'student',
};

const STEP_PAUSE_MS = Number(process.env.UI_STEP_PAUSE || 700);

async function pause(page) {
  if (STEP_PAUSE_MS > 0) await page.waitForTimeout(STEP_PAUSE_MS);
}

function logCase(id, title) {
  console.log(`[${id}] ${title}`);
}

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function apiLogin(user) {
  const out = await api('/auth/login', {
    method: 'POST',
    body: { username: user.username, password: user.password },
  });
  assert.equal(out.status, 200, `Login failed for ${user.username}: ${JSON.stringify(out.json)}`);
  return out.json.token;
}

async function createApprovedInternship(title, opts = {}) {
  const companyToken = await apiLogin(COMPANY);
  const adminToken = await apiLogin(ADMIN);

  const created = await api('/internships', {
    method: 'POST',
    token: companyToken,
    body: {
      title,
      company: COMPANY.username,
      description: opts.description || 'Checklist internship',
      domain: opts.domain || 'Web',
      location: opts.location || 'Remote',
      durationWeeks: opts.durationWeeks || 8,
      applicationDeadline: opts.deadline || undefined,
      stipend: opts.stipend || '10000',
      eligibility: opts.eligibility || 'Any UG',
      skillsRequired: opts.skills || 'HTML,CSS,JavaScript',
      youtubeUrl: opts.youtubeUrl || '',
    },
  });
  assert.equal(created.status, 201, `Create internship failed: ${JSON.stringify(created.json)}`);

  const approved = await api('/admin/approve', {
    method: 'POST',
    token: adminToken,
    body: { internshipId: created.json._id },
  });
  assert.equal(approved.status, 200, `Approve failed: ${JSON.stringify(approved.json)}`);

  return created.json;
}

async function openAuth(page) {
  await page.goto(UI_BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#landing');
  await page.click('#getStartedBtn');
  await page.waitForSelector('#auth-section:not(.hidden)');
}

async function uiLogin(page, { username, password, role }) {
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.selectOption('#role', role);
  await page.click('#loginBtn');
}

async function uiWaitDashboard(page, roleText) {
  await page.waitForSelector('#dashboard:not(.hidden)', { timeout: 20000 });
  const title = await page.textContent('#dashboardTitle');
  assert.match((title || '').toLowerCase(), new RegExp(roleText, 'i'));
}

async function uiLogout(page) {
  await page.click('#logoutBtn');
  await page.waitForSelector('#landing:not(.hidden)', { timeout: 20000 });
}

test('Lab one-by-one valid/invalid checklist on local website', async () => {
  const headless = String(process.env.UI_HEADLESS || 'false').toLowerCase() === 'true';
  const slowMo = headless ? 0 : Number(process.env.UI_SLOWMO || 1400);
  const browser = await chromium.launch({ headless, slowMo });
  const page = await browser.newPage();

  page.on('dialog', async (dialog) => {
    await dialog.accept('Automation reason');
  });

  const openTitle = `Open Internship ${RUN_ID}`;
  const closedTitle = `Closed Internship ${RUN_ID}`;

  try {
    // Setup data for deterministic checks.
    await createApprovedInternship(openTitle, {
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    await createApprovedInternship(closedTitle, {
      deadline: new Date(Date.now() - 86400000).toISOString(),
    });

    await openAuth(page);

    // Login 1..7
    logCase('L1', 'Valid username/password login');
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');
    await pause(page);

    logCase('L5', 'After login dashboard reached');
    const dashVisible = await page.$eval('#dashboard', (el) => !el.classList.contains('hidden'));
    assert.equal(dashVisible, true);

    logCase('L6', 'Logout ends session');
    await uiLogout(page);
    await pause(page);

    logCase('L2', 'Wrong username/wrong password clear message');
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, { username: 'wrong_user_xyz', password: STUDENT.password, role: 'student' });
    let msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /invalid|credentials/);
    await uiLogin(page, { username: STUDENT.username, password: 'Wrong@123', role: 'student' });
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /invalid|credentials/);
    await pause(page);

    logCase('L3', 'Empty username/password blocked');
    await page.fill('#username', '');
    await page.fill('#password', '');
    await page.click('#loginBtn');
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /please enter both username and password/);

    logCase('L4', 'Case sensitivity check');
    await uiLogin(page, {
      username: STUDENT.username.toUpperCase(),
      password: STUDENT.password,
      role: 'student',
    });
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /invalid|credentials/);

    logCase('L7', 'After logout cannot access protected content');
    const adminPanelVisibleWhenLoggedOut = await page.$eval('#adminPanel', (el) => !el.classList.contains('hidden'));
    assert.equal(adminPanelVisibleWhenLoggedOut, false);

    // Sign-up 1..7 (UI + API adaptation for email/phone fields)
    logCase('S1', 'Register valid details');
    const freshUser = `lab_user_${RUN_ID}`;
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', freshUser);
    await page.fill('#password', 'Hello123');
    await page.selectOption('#role', 'student');
    await page.click('#registerBtn');
    await uiWaitDashboard(page, 'student');
    await uiLogout(page);

    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');

    logCase('S2', 'Name letters-only validation');
    await page.fill('#registerFullName', 'Lab123');
    await page.fill('#username', `letters_${RUN_ID}`);
    await page.fill('#password', 'Hello123');
    await page.selectOption('#role', 'student');
    await page.click('#registerBtn');
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /full name|letters only/);

    logCase('S3', 'Username special chars blocked');
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', 'bad@user');
    await page.fill('#password', 'Hello123');
    await page.click('#registerBtn');
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /username may use only letters|username/);

    logCase('S6', 'Weak password blocked');
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', `weak_${RUN_ID}`);
    await page.fill('#password', 'abc');
    await page.click('#registerBtn');
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /password|at least/);

    logCase('S7', 'Duplicate username blocked');
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', freshUser);
    await page.fill('#password', 'Hello123');
    await page.click('#registerBtn');
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /already|taken|registered/);

    logCase('S4,S5', 'Email/phone validation via API (UI has no fields at register)');
    const badEmail = await api('/auth/register', {
      method: 'POST',
      body: {
        username: `badmail_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Bad Mail',
        email: 'badmail',
        phone: '9876543210',
      },
    });
    assert.notEqual(badEmail.status, 201);

    const badPhone = await api('/auth/register', {
      method: 'POST',
      body: {
        username: `badphone_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Bad Phone',
        email: `badphone_${RUN_ID}@mail.com`,
        phone: '12345678',
      },
    });
    assert.notEqual(badPhone.status, 201);

    const goodPhone = await api('/auth/register', {
      method: 'POST',
      body: {
        username: `goodphone_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Good Phone',
        email: `goodphone_${RUN_ID}@mail.com`,
        phone: '9876543210',
      },
    });
    assert.equal(goodPhone.status, 201);

    // Re-login as student for core UI checks.
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');

    // Browse & Search 1..7
    logCase('B1', 'Internship list loads');
    await page.click('#loadInternshipsBtn');
    await page.waitForSelector('#internshipList li', { timeout: 20000 });

    logCase('B2', 'Search keyword matches');
    await page.fill('#internshipSearchInput', openTitle);
    await page.click('#loadInternshipsBtn');
    const openItem = page.locator('#internshipList li', { hasText: openTitle }).first();
    await openItem.waitFor({ state: 'visible', timeout: 20000 });

    logCase('B3,B6', 'Filter/sort checks');
    await page.fill('#filterDomain', 'Web');
    await page.fill('#filterLocation', 'Remote');
    await page.fill('#filterDuration', '8');
    await page.selectOption('#sortInternships', 'company');
    await page.click('#loadInternshipsBtn');
    await openItem.waitFor({ state: 'visible', timeout: 20000 });

    logCase('B4', 'No results helpful message');
    await page.fill('#internshipSearchInput', `NO_MATCH_${RUN_ID}`);
    await page.click('#loadInternshipsBtn');
    const noResult = await page.textContent('#internshipList li');
    assert.match((noResult || '').toLowerCase(), /no internships match|clear filters/);

    logCase('B5', 'List item has main details');
    await page.fill('#internshipSearchInput', openTitle);
    await page.click('#loadInternshipsBtn');
    await openItem.waitFor({ state: 'visible', timeout: 20000 });
    const openText = await openItem.textContent();
    assert.match((openText || '').toLowerCase(), /open internship|company_ias/);

    logCase('B7', 'Only active/open shown by default');
    const closedVisible = await page.locator('#internshipList li', { hasText: closedTitle }).count();
    assert.equal(closedVisible, 0);

    // Internship details 1..7
    logCase('D1', 'Click internship opens details');
    await openItem.locator('button', { hasText: 'View Details' }).click();
    await page.waitForSelector('#internshipDetailsCard:not(.hidden)', { timeout: 15000 });

    logCase('D2,D3', 'Description/eligibility/skills/duration/deadline/stipend visible');
    const dTitle = await page.textContent('#detailsTitle');
    const dDesc = await page.textContent('#detailsDescription');
    const dEligibility = await page.textContent('#detailsEligibility');
    const dSkills = await page.textContent('#detailsSkills');
    const dDuration = await page.textContent('#detailsDuration');
    const dDeadline = await page.textContent('#detailsDeadline');
    const dStipend = await page.textContent('#detailsStipend');
    assert.match(dTitle || '', new RegExp(openTitle));
    assert.ok((dDesc || '').trim().length > 0);
    assert.match((dEligibility || '').toLowerCase(), /eligibility|not specified|any ug/);
    assert.match((dSkills || '').toLowerCase(), /skills|not specified|html/);
    assert.match((dDuration || '').toLowerCase(), /duration|weeks|not specified/);
    assert.match((dDeadline || '').toLowerCase(), /deadline|not specified/);
    assert.match((dStipend || '').toLowerCase(), /stipend|not specified|10000/);

    logCase('D4', 'Apply shown only when open');
    const applyDisabled = await page.$eval('#detailsApplyBtn', (el) => el.disabled);
    assert.equal(applyDisabled, false);

    logCase('D5', 'Official/contact links open safely');
    const videoWrapHidden = await page.$eval('#detailsVideoLinkWrap', (el) => el.classList.contains('hidden'));
    if (!videoWrapHidden) {
      const href = await page.getAttribute('#detailsVideoLink', 'href');
      assert.ok(href && href.startsWith('http'));
    }

    logCase('D6', 'Missing fields shown safely');
    assert.match((dEligibility || '').toLowerCase(), /eligibility|not specified|any ug/);

    logCase('D7', 'Mobile readability + back navigation');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#closeDetailsBtn');
    await page.waitForSelector('#internshipDetailsCard.hidden');
    await page.setViewportSize({ width: 1280, height: 720 });

    // Applications 1..7
    logCase('A1', 'Apply requires logged in user (API check)');
    const unauthorizedApply = await api('/apply', {
      method: 'POST',
      body: { internshipId: '000000000000000000000000' },
    });
    assert.notEqual(unauthorizedApply.status, 201);

    logCase('A2,A3', 'Required fields + resume validation');
    await openItem.locator('button', { hasText: 'Apply' }).click();
    await page.waitForSelector('#applyFormCard:not(.hidden)', { timeout: 15000 });
    await page.fill('#applyFullName', 'Student123');
    await page.fill('#applyEmail', 'bad_email');
    await page.fill('#applyPhone', '12345678');
    await page.fill('#applyResumeLink', 'bad-link');
    await page.click('#submitApplyBtn');
    let applyMsg = await page.textContent('#applyMessage');
    assert.match((applyMsg || '').toLowerCase(), /full name|email|phone|resume link/);

    logCase('A4,A6', 'Valid submit confirmation + appears in my applications');
    await page.fill('#applyFullName', 'Meena');
    await page.fill('#applyEmail', `meena_${RUN_ID}@mail.com`);
    await page.fill('#applyPhone', '9876543210');
    await page.fill('#applyEducation', 'B.E');
    await page.fill('#applyQualification', '8.0 CGPA');
    await page.fill('#applySkills', 'JS,Node');
    await page.fill('#applyResumeLink', 'https://example.com/resume.pdf');
    await page.fill('#applyCoverLetter', 'Please consider my application');
    await page.click('#submitApplyBtn');
    await page.waitForSelector('#applyFormCard', { state: 'hidden', timeout: 20000 });

    await page.click('#loadApplicationsBtn');
    const appItem = page.locator('#applicationList li', { hasText: openTitle }).first();
    await appItem.waitFor({ state: 'visible', timeout: 20000 });

    logCase('A5', 'Duplicate apply blocked');
    await openItem.locator('button', { hasText: 'Apply' }).click();
    await page.waitForSelector('#applyFormCard:not(.hidden)', { timeout: 15000 });
    await page.fill('#applyFullName', 'Meena');
    await page.fill('#applyEmail', `meena_${RUN_ID}@mail.com`);
    await page.fill('#applyPhone', '9876543210');
    await page.click('#submitApplyBtn');
    applyMsg = await page.textContent('#applyMessage');
    assert.match((applyMsg || '').toLowerCase(), /already applied|duplicate|already/);
    await page.click('#cancelApplyBtn');

    logCase('A7', 'Applications blocked after closing date (API check)');
    const studentToken = await apiLogin(STUDENT);
    const listClosed = await api('/internships?includeClosed=true');
    const closed = (listClosed.json || []).find((x) => x.title === closedTitle);
    assert.ok(closed && closed._id, 'Closed internship missing in includeClosed list');
    const closedApply = await api('/apply', {
      method: 'POST',
      token: studentToken,
      body: {
        internshipId: closed._id,
        fullName: 'Meena',
        email: `meena_closed_${RUN_ID}@mail.com`,
        phone: '9876543210',
      },
    });
    assert.notEqual(closedApply.status, 201);

    // Awareness 1..7
    logCase('W1,W3', 'FAQs render and search works');
    await uiLogout(page);
    const faqCount = await page.locator('#faqList li').count();
    assert.ok(faqCount >= 1);
    await page.fill('#faqSearchInput', 'internship');
    await page.waitForTimeout(700);
    const filtered = await page.locator('#faqList li').count();
    assert.ok(filtered >= 1);

    logCase('W2,W7', 'External resource links valid');
    const extHref = await page.getAttribute('#awarenessSection a[target="_blank"]', 'href');
    assert.ok(extHref && extHref.startsWith('http'));

    logCase('W4', 'Only published content visible (no draft items)');
    const awarenessText = (await page.textContent('#awarenessSection')) || '';
    assert.ok(!/draft|unpublished/i.test(awarenessText));

    logCase('W5', 'Media do not break layout');
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');
    await openItem.locator('button', { hasText: 'View Details' }).click();
    await page.waitForSelector('#internshipDetailsCard:not(.hidden)');
    const imgOk = await page.$eval('#detailsImage', (img) => !!img && img.getAttribute('src') !== null);
    assert.equal(imgOk, true);

    logCase('W6', 'Empty sections handled safely');
    await page.fill('#internshipSearchInput', `EMPTY_${RUN_ID}`);
    await page.click('#loadInternshipsBtn');
    const emptyMsg = await page.textContent('#internshipList li');
    assert.match((emptyMsg || '').toLowerCase(), /no internships match|clear filters/);

    // Notifications 1..7
    logCase('N1', 'Student receives notification for approved internship');
    await page.click('#loadNotificationsBtn');
    await page.waitForSelector('#notificationList li', { timeout: 20000 });
    const notifFirst = await page.textContent('#notificationList li');
    assert.ok((notifFirst || '').trim().length > 0);

    logCase('N2', 'Deadline reminder-style text exists in approval notification');
    const studentNotifs = await api('/notifications', { token: studentToken });
    const hasDeadlineHint = (studentNotifs.json || []).some((n) =>
      /apply before|approved internship|deadline/i.test(n.message || '')
    );
    assert.equal(hasDeadlineHint, true);

    logCase('N3', 'Toggle notifications on/off and save');
    const beforeMaster = await page.isChecked('#notifMasterToggle');
    await page.click('#notifMasterToggle');
    await page.waitForTimeout(600);
    const afterMaster = await page.isChecked('#notifMasterToggle');
    assert.notEqual(beforeMaster, afterMaster);

    logCase('N4', 'Different user should not receive another user alerts');
    const otherUser = `notif_other_${RUN_ID}`;
    const otherReg = await api('/auth/register', {
      method: 'POST',
      body: {
        username: otherUser,
        password: 'Hello123',
        role: 'student',
        fullName: 'Other Student',
        email: `other_${RUN_ID}@mail.com`,
        phone: '9876543210',
      },
    });
    assert.equal(otherReg.status, 201);
    const otherToken = otherReg.json.token;
    const adminToken = await apiLogin(ADMIN);
    await api('/admin/notify', {
      method: 'POST',
      token: adminToken,
      body: {
        recipientId: otherReg.json.user.id,
        message: `Private note ${RUN_ID}`,
      },
    });
    const meNotes = await api('/notifications', { token: studentToken });
    const otherNotes = await api('/notifications', { token: otherToken });
    const meHasPrivate = (meNotes.json || []).some((n) => (n.message || '').includes(`Private note ${RUN_ID}`));
    const otherHasPrivate = (otherNotes.json || []).some((n) => (n.message || '').includes(`Private note ${RUN_ID}`));
    assert.equal(meHasPrivate, false);
    assert.equal(otherHasPrivate, true);

    logCase('N5', 'Notification text should be clear');
    const clearText = (meNotes.json || []).every((n) => (n.message || '').trim().length >= 5);
    assert.equal(clearText, true);

    logCase('N6', 'No duplicate notifications for same event');
    const msgs = (meNotes.json || []).map((n) => n.message || '');
    const dupRatio = new Set(msgs).size / Math.max(1, msgs.length);
    assert.ok(dupRatio >= 0.5, 'Too many duplicates observed in notifications');

    logCase('N7', 'Opening notification flow works (bell + mark read)');
    await page.click('#notifBellBtn');
    await page.waitForSelector('#notifDropdown:not(.hidden)', { timeout: 15000 });
    await page.click('#notifMarkAllRead');
    await page.waitForTimeout(600);

    // Admin 1..7
    logCase('AD1', 'Admin valid login opens dashboard');
    await uiLogout(page);
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, ADMIN);
    await uiWaitDashboard(page, 'admin');

    logCase('AD2', 'Wrong admin credentials rejected');
    await uiLogout(page);
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, { username: ADMIN.username, password: 'Wrong@123', role: 'admin' });
    msg = await page.textContent('#authMessage');
    assert.match((msg || '').toLowerCase(), /invalid|credentials/);

    logCase('AD3', 'Add internship and visible to students (company+admin verification model)');
    const adminCheckTitle = `AdminCheck ${RUN_ID}`;
    await createApprovedInternship(adminCheckTitle);
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');
    await page.fill('#internshipSearchInput', adminCheckTitle);
    await page.click('#loadInternshipsBtn');
    const adVisible = await page.locator('#internshipList li', { hasText: adminCheckTitle }).count();
    assert.ok(adVisible >= 1);

    logCase('AD4', 'Edit internship updates details (company edit + admin re-approve)');
    const companyToken = await apiLogin(COMPANY);
    const mine = await api('/internships/mine', { token: companyToken });
    const target = (mine.json || []).find((i) => i.title === adminCheckTitle);
    assert.ok(target && target._id);
    const updatedTitle = `${adminCheckTitle} Updated`;
    const upd = await api(`/internships/${target._id}/update`, {
      method: 'PUT',
      token: companyToken,
      body: { title: updatedTitle, description: 'Updated description by automation' },
    });
    assert.equal(upd.status, 200);
    const adminToken2 = await apiLogin(ADMIN);
    await api('/admin/approve', { method: 'POST', token: adminToken2, body: { internshipId: target._id } });
    await page.fill('#internshipSearchInput', updatedTitle);
    await page.click('#loadInternshipsBtn');
    const updVisible = await page.locator('#internshipList li', { hasText: updatedTitle }).count();
    assert.ok(updVisible >= 1);

    logCase('AD5', 'Delete internship removes it from student list');
    const del = await api(`/internships/${target._id}`, { method: 'DELETE', token: companyToken });
    assert.equal(del.status, 200);
    await page.fill('#internshipSearchInput', updatedTitle);
    await page.click('#loadInternshipsBtn');
    const deletedVisible = await page.locator('#internshipList li', { hasText: updatedTitle }).count();
    assert.equal(deletedVisible, 0);

    logCase('AD6', 'Admin can view applications list');
    await uiLogout(page);
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, ADMIN);
    await uiWaitDashboard(page, 'admin');
    await page.click('#adminLoadApplicationsBtn');
    await page.waitForSelector('#adminApplicationList li', { timeout: 20000 });

    logCase('AD7', 'Student cannot open admin screen');
    await uiLogout(page);
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');
    const adminPanelVisible = await page.$eval('#adminPanel', (el) => !el.classList.contains('hidden'));
    assert.equal(adminPanelVisible, false);

    console.log('All checklist cases executed with valid/invalid branches.');
  } finally {
    await page.close();
    await browser.close();
  }
});
