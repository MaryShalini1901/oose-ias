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

const STEP_PAUSE_MS = Number(process.env.UI_STEP_PAUSE || 450);

async function pause(page, ms = STEP_PAUSE_MS) {
  if (ms > 0) {
    await page.waitForTimeout(ms);
  }
}

async function apiRequest(path, { method = 'GET', body, token } = {}) {
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

async function apiLogin({ username, password }) {
  const out = await apiRequest('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  assert.equal(out.status, 200, `API login failed for ${username}: ${JSON.stringify(out.json)}`);
  return out.json.token;
}

async function createApprovedInternship(title, deadlineIso) {
  const companyToken = await apiLogin(COMPANY);
  const adminToken = await apiLogin(ADMIN);

  const created = await apiRequest('/internships', {
    method: 'POST',
    token: companyToken,
    body: {
      title,
      company: COMPANY.username,
      description: 'Lab checklist generated internship',
      domain: 'Web',
      location: 'Remote',
      durationWeeks: 8,
      applicationDeadline: deadlineIso || undefined,
      stipend: '10000',
      eligibility: 'Any UG',
      skillsRequired: 'HTML,CSS,JavaScript',
    },
  });
  assert.equal(created.status, 201, `Create internship failed: ${JSON.stringify(created.json)}`);

  const approved = await apiRequest('/admin/approve', {
    method: 'POST',
    token: adminToken,
    body: { internshipId: created.json._id },
  });
  assert.equal(approved.status, 200, `Approve internship failed: ${JSON.stringify(approved.json)}`);
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
  const dashTitle = await page.textContent('#dashboardTitle');
  assert.match((dashTitle || '').toLowerCase(), new RegExp(roleText, 'i'));
}

async function uiLogout(page) {
  await page.click('#logoutBtn');
  await page.waitForSelector('#landing:not(.hidden)', { timeout: 15000 });
}

test('Lab checklist UI automation with real local website', async () => {
  const headless = String(process.env.UI_HEADLESS || 'false').toLowerCase() === 'true';
  const slowMo = headless ? 0 : Number(process.env.UI_SLOWMO || 1300);
  const browser = await chromium.launch({ headless, slowMo });
  const page = await browser.newPage();

  page.on('dialog', async (d) => {
    await d.accept('Automation reason');
  });

  const uniqueTitle = `Lab Internship ${RUN_ID}`;

  try {
    console.log('CHECKSETUP: Prepare deterministic approved internship via API');
    // Setup one approved internship so browse/search/details/apply checks are deterministic.
    await createApprovedInternship(uniqueTitle);
    await pause(page);

    console.log('CHECK SIGNUP API: email/phone/password validations not present in UI form');
    const apiRegWeak = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        username: `api_weak_${RUN_ID}`,
        password: 'weak',
        role: 'student',
        fullName: 'Api Weak',
        email: `apiweak_${RUN_ID}@mail.com`,
        phone: '9876543210',
      },
    });
    assert.notEqual(apiRegWeak.status, 201, 'Weak password should not be accepted.');

    const apiRegBadEmail = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        username: `api_bad_email_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Api Mail',
        email: 'not-an-email',
        phone: '9876543210',
      },
    });
    assert.notEqual(apiRegBadEmail.status, 201, 'Invalid email should be rejected.');

    const apiRegBadPhone = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        username: `api_bad_phone_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Api Phone',
        email: `apiphone_${RUN_ID}@mail.com`,
        phone: '12345678',
      },
    });
    assert.notEqual(apiRegBadPhone.status, 201, 'Phone must be exactly 10 digits.');

    const apiRegGood = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        username: `api_good_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Api Good',
        email: `apigood_${RUN_ID}@mail.com`,
        phone: '9876543210',
      },
    });
    assert.equal(apiRegGood.status, 201, 'Valid 10-digit phone should register successfully.');

    const apiRegDuplicate = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        username: `api_good_${RUN_ID}`,
        password: 'Hello123',
        role: 'student',
        fullName: 'Api Good',
        email: `apigood_${RUN_ID}@mail.com`,
        phone: '9876543210',
      },
    });
    assert.notEqual(apiRegDuplicate.status, 201, 'Duplicate username/email should fail.');

    // Login checks 1..7
    console.log('CHECK LOGIN: wrong username should fail with clear error');
    await openAuth(page);
    await page.fill('#username', 'wrong_user_123');
    await page.fill('#password', STUDENT.password);
    await page.selectOption('#role', 'student');
    await page.click('#loginBtn');
    await page.waitForFunction(() => (document.getElementById('authMessage')?.textContent || '').length > 0);
    let authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /invalid|credentials/);
    await pause(page);

    console.log('CHECK LOGIN: wrong password should fail with clear error');
    await page.fill('#username', STUDENT.username);
    await page.fill('#password', 'Wrong@123');
    await page.click('#loginBtn');
    await page.waitForFunction(() => (document.getElementById('authMessage')?.textContent || '').length > 0);
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /invalid|credentials/);
    await pause(page);

    console.log('CHECK LOGIN: empty username/password should not submit');
    await page.fill('#username', '');
    await page.fill('#password', '');
    await page.click('#loginBtn');
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /please enter both username and password/);
    await pause(page);

    console.log('CHECK LOGIN: valid credentials should open dashboard');
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');
    await pause(page);

    console.log('CHECK LOGOUT: logout should end session and go to landing');
    await uiLogout(page);
    await page.goto(`${UI_BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#landing:not(.hidden)');
    await pause(page);

    // Case sensitivity (username upper-case should fail)
    console.log('CHECK LOGIN: username/password case sensitivity');
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, {
      username: STUDENT.username.toUpperCase(),
      password: STUDENT.password,
      role: 'student',
    });
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /invalid|credentials/);
    await pause(page);

    // Sign-up checks 1..7 (adapted for fields available in this app)
    console.log('CHECK SIGNUP: valid registration should succeed');
    const newUser = `lab_user_${RUN_ID}`;
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', newUser);
    await page.fill('#password', 'Hello123');
    await page.selectOption('#role', 'student');
    await page.click('#registerBtn');
    await uiWaitDashboard(page, 'student');
    await uiLogout(page);
    await pause(page);

    console.log('CHECK SIGNUP: name with numbers should fail');
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await page.fill('#registerFullName', 'Lab123');
    await page.fill('#username', `bad_${RUN_ID}`);
    await page.fill('#password', 'Hello123');
    await page.selectOption('#role', 'student');
    await page.click('#registerBtn');
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /full name|letters only/);
    await pause(page);

    console.log('CHECK SIGNUP: username special chars should fail');
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', 'bad@user');
    await page.fill('#password', 'Hello123');
    await page.click('#registerBtn');
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /username may use only letters|username/);
    await pause(page);

    console.log('CHECK SIGNUP: password not meeting min rules should fail');
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', `weak_${RUN_ID}`);
    await page.fill('#password', 'abc');
    await page.click('#registerBtn');
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /password|at least/);
    await pause(page);

    // Duplicate username check
    console.log('CHECK SIGNUP: duplicate username should fail');
    await page.fill('#registerFullName', 'Lab User');
    await page.fill('#username', newUser);
    await page.fill('#password', 'Hello123');
    await page.click('#registerBtn');
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /already|taken|registered/);
    await pause(page);

    // Login again with provided student for remaining checks
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');

    // Browse/search internships checks 1..7
    console.log('CHECK BROWSE: list/search/filter/sort/no-results');
    await page.fill('#internshipSearchInput', uniqueTitle);
    await page.click('#loadInternshipsBtn');
    const listed = page.locator('#internshipList li', { hasText: uniqueTitle }).first();
    await listed.waitFor({ state: 'visible', timeout: 20000 });

    const firstItemText = await listed.textContent();
    assert.match((firstItemText || '').toLowerCase(), /company_ias|lab internship/);

    await page.fill('#filterDomain', 'Web');
    await page.fill('#filterLocation', 'Remote');
    await page.fill('#filterDuration', '8');
    await page.selectOption('#sortInternships', 'company');
    await page.click('#loadInternshipsBtn');
    await listed.waitFor({ state: 'visible', timeout: 20000 });

    await page.fill('#internshipSearchInput', `NO_MATCH_${RUN_ID}`);
    await page.click('#loadInternshipsBtn');
    const emptyText = await page.textContent('#internshipList li');
    assert.match((emptyText || '').toLowerCase(), /no internships match|clear filters/);
    await pause(page);

    // Internship details checks 1..7
    console.log('CHECK DETAILS: open full details and verify fields visible');
    await page.fill('#internshipSearchInput', uniqueTitle);
    await page.click('#loadInternshipsBtn');
    await listed.waitFor({ state: 'visible', timeout: 20000 });
    await listed.locator('button', { hasText: 'View Details' }).click();

    await page.waitForSelector('#internshipDetailsCard:not(.hidden)');
    const dTitle = await page.textContent('#detailsTitle');
    const dDesc = await page.textContent('#detailsDescription');
    const dEligibility = await page.textContent('#detailsEligibility');
    const dSkills = await page.textContent('#detailsSkills');
    const dDuration = await page.textContent('#detailsDuration');
    const dDeadline = await page.textContent('#detailsDeadline');
    const dStipend = await page.textContent('#detailsStipend');
    assert.match(dTitle || '', new RegExp(uniqueTitle));
    assert.ok((dDesc || '').trim().length > 0);
    assert.match((dEligibility || '').toLowerCase(), /eligibility|not specified|any ug/);
    assert.match((dSkills || '').toLowerCase(), /skills|not specified|html/);
    assert.match((dDuration || '').toLowerCase(), /duration|weeks|not specified/);
    assert.match((dDeadline || '').toLowerCase(), /deadline|not specified/);
    assert.match((dStipend || '').toLowerCase(), /stipend|not specified|10000/);

    const applyDisabled = await page.$eval('#detailsApplyBtn', (el) => el.disabled);
    assert.equal(applyDisabled, false);
    await page.click('#closeDetailsBtn');
    await page.waitForSelector('#internshipDetailsCard.hidden');
    await pause(page);

    // Application checks 1..7
    console.log('CHECK APPLY: invalid details should show errors');
    await listed.locator('button', { hasText: 'Apply' }).click();
    await page.waitForSelector('#applyFormCard:not(.hidden)');

    await page.fill('#applyFullName', 'Student 123');
    await page.fill('#applyEmail', 'bad_email');
    await page.fill('#applyPhone', '12345678');
    await page.fill('#applyResumeLink', 'bad-link');
    await page.click('#submitApplyBtn');
    const applyErr = await page.textContent('#applyMessage');
    assert.match((applyErr || '').toLowerCase(), /full name|email|phone|resume link/);
    await pause(page);

    console.log('CHECK APPLY: valid details (10-digit phone) should submit');
    await page.fill('#applyFullName', 'Meena');
    await page.fill('#applyEmail', `meena_${RUN_ID}@mail.com`);
    await page.fill('#applyPhone', '9876543210');
    await page.fill('#applyEducation', 'B.E');
    await page.fill('#applyQualification', '8.0 CGPA');
    await page.fill('#applySkills', 'JS,Node');
    await page.fill('#applyResumeLink', 'https://example.com/resume.pdf');
    await page.fill('#applyCoverLetter', 'Please consider my application.');
    await page.click('#submitApplyBtn');
    await page.waitForSelector('#applyFormCard', { state: 'hidden', timeout: 20000 });

    await page.click('#loadApplicationsBtn');
    const appRow = page.locator('#applicationList li', { hasText: uniqueTitle }).first();
    await appRow.waitFor({ state: 'visible', timeout: 20000 });
    await pause(page);

    // Duplicate apply attempt should fail
    console.log('CHECK APPLY: duplicate apply should fail');
    await listed.locator('button', { hasText: 'Apply' }).click();
    await page.waitForSelector('#applyFormCard:not(.hidden)');
    await page.fill('#applyFullName', 'Meena');
    await page.fill('#applyEmail', `meena_${RUN_ID}@mail.com`);
    await page.fill('#applyPhone', '9876543210');
    await page.click('#submitApplyBtn');
    const duplicateMsg = await page.textContent('#applyMessage');
    assert.match((duplicateMsg || '').toLowerCase(), /already applied|duplicate|already/);
    await page.click('#cancelApplyBtn');
    await pause(page);

    // Awareness checks 1..7
    console.log('CHECK AWARENESS: FAQs/resources/search should work');
    await page.click('#logoutBtn');
    await page.waitForSelector('#landing:not(.hidden)');
    const faqCount = await page.locator('#faqList li').count();
    assert.ok(faqCount >= 1);
    const guideLink = await page.getAttribute('#awarenessSection a[target="_blank"]', 'href');
    assert.ok(guideLink && guideLink.startsWith('http'));
    await page.fill('#faqSearchInput', 'notifications');
    await page.waitForTimeout(600);
    const filteredFaqCount = await page.locator('#faqList li').count();
    assert.ok(filteredFaqCount >= 1);
    await pause(page);

    // Login again for notifications/admin-related checks.
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');

    // Notifications checks 1..7 (in-app feature based)
    console.log('CHECK NOTIFICATIONS: list and toggles should work');
    await page.click('#loadNotificationsBtn');
    await page.waitForSelector('#notificationList li', { timeout: 20000 });
    const notifText = await page.textContent('#notificationList li');
    assert.ok((notifText || '').trim().length > 0);

    const beforeToggle = await page.isChecked('#notifMasterToggle');
    await page.click('#notifMasterToggle');
    await page.waitForTimeout(400);
    const afterToggle = await page.isChecked('#notifMasterToggle');
    assert.notEqual(beforeToggle, afterToggle);

    const beforeAlerts = await page.isChecked('#internshipAlertsToggle');
    await page.click('#internshipAlertsToggle');
    await page.waitForTimeout(400);
    const afterAlerts = await page.isChecked('#internshipAlertsToggle');
    assert.notEqual(beforeAlerts, afterAlerts);
    await pause(page);

    // Admin checks 1..7
    console.log('CHECK ADMIN: valid login and screens');
    await uiLogout(page);
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, ADMIN);
    await uiWaitDashboard(page, 'admin');
    await page.click('#loadPendingInternshipsBtn');
    await page.waitForSelector('#pendingInternshipList li', { timeout: 20000 });
    await page.click('#adminLoadApplicationsBtn');
    await page.waitForSelector('#adminApplicationList li', { timeout: 20000 });
    await pause(page);

    // Wrong admin credentials should fail
    console.log('CHECK ADMIN: wrong credentials should fail');
    await uiLogout(page);
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await uiLogin(page, { username: ADMIN.username, password: 'Wrong@123', role: 'admin' });
    authMsg = await page.textContent('#authMessage');
    assert.match((authMsg || '').toLowerCase(), /invalid|credentials/);
    await pause(page);

    // Student cannot access admin panel after student login.
    console.log('CHECK ADMIN: student cannot access admin panel');
    await uiLogin(page, STUDENT);
    await uiWaitDashboard(page, 'student');
    const adminPanelVisible = await page.$eval('#adminPanel', (el) => !el.classList.contains('hidden'));
    assert.equal(adminPanelVisible, false);
  } finally {
    await page.close();
    await browser.close();
  }
});
