const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const UI_BASE = process.env.UI_BASE_URL || 'http://localhost:5500';
const RUN_ID = Date.now();
const LOCAL_STUDENT_USERNAME = process.env.LOCAL_STUDENT_USERNAME || '';
const LOCAL_STUDENT_PASSWORD = process.env.LOCAL_STUDENT_PASSWORD || '';

async function openAuth(page) {
  await page.goto(UI_BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#landing');
  await page.click('#getStartedBtn');
  await page.waitForSelector('#auth-section:not(.hidden)');
}

async function registerAndEnterDashboard(page, { fullName, username, password, role }) {
  await page.fill('#registerFullName', fullName);
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.selectOption('#role', role);
  await page.click('#registerBtn');
  await page.waitForSelector('#dashboard:not(.hidden)');
  const title = await page.textContent('#dashboardTitle');
  assert.match((title || '').toLowerCase(), new RegExp(role, 'i'));
}

async function loginAndEnterDashboard(page, { username, password, role }) {
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.selectOption('#role', role);
  await page.click('#loginBtn');
  await page.waitForSelector('#dashboard:not(.hidden)');
}

async function logoutToLanding(page) {
  await page.click('#logoutBtn');
  await page.waitForSelector('#landing:not(.hidden)');
}

test('Real system automation: company -> admin -> student full flow', async () => {
  const headless = String(process.env.UI_HEADLESS || 'true').toLowerCase() === 'true';
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 180 });
  const page = await browser.newPage();

  page.on('dialog', async (dialog) => {
    // Frontend uses alert/confirm/prompt for status messages and actions.
    await dialog.accept('Automation reason');
  });

  const internshipTitle = `Auto Internship ${RUN_ID}`;
  const companyUser = `cmp_${RUN_ID}`;
  const adminUser = `adm_${RUN_ID}`;
  const studentUser = `stu_${RUN_ID}`;

  try {
    await openAuth(page);

    // 1) Company registers and posts internship.
    await registerAndEnterDashboard(page, {
      fullName: 'Test Company',
      username: companyUser,
      password: 'Comp@1234',
      role: 'company',
    });

    await page.fill('#internshipTitle', internshipTitle);
    await page.fill('#internshipCompany', companyUser);
    await page.fill('#internshipDescription', 'Real UI automation posting');
    await page.fill('#internshipDomain', 'Web');
    await page.fill('#internshipLocation', 'Remote');
    await page.fill('#internshipDurationWeeks', '8');
    await page.fill('#internshipEligibility', 'Any UG student');
    await page.fill('#internshipSkillsRequired', 'HTML,CSS,JS');
    await page.click('#postInternshipBtn');
    await page.waitForFunction(() => {
      const el = document.getElementById('companyMessage');
      return !!el && /awaiting admin approval/i.test(el.textContent || '');
    });

    await logoutToLanding(page);

    // 2) Admin registers and approves pending internship.
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await registerAndEnterDashboard(page, {
      fullName: 'Test Admin',
      username: adminUser,
      password: 'Admin@1234',
      role: 'admin',
    });

    await page.click('#loadPendingInternshipsBtn');
    const pendingItem = page.locator('#pendingInternshipList li', { hasText: internshipTitle }).first();
    await pendingItem.waitFor({ state: 'visible', timeout: 20000 });
    await pendingItem.locator('button', { hasText: 'Verify (Approve)' }).click();

    await page.waitForFunction(
      (title) => {
        const list = document.querySelectorAll('#pendingInternshipList li');
        return Array.from(list).every((li) => !(li.textContent || '').includes(title));
      },
      internshipTitle
    );

    await logoutToLanding(page);

    // 3) Student registers, searches, opens details, applies.
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await registerAndEnterDashboard(page, {
      fullName: 'Test Student',
      username: studentUser,
      password: 'Stud1234',
      role: 'student',
    });

    await page.fill('#internshipSearchInput', internshipTitle);
    await page.click('#loadInternshipsBtn');

    const studentItem = page.locator('#internshipList li', { hasText: internshipTitle }).first();
    await studentItem.waitFor({ state: 'visible', timeout: 20000 });
    await studentItem.locator('button', { hasText: 'View Details' }).click();

    await page.waitForSelector('#internshipDetailsCard:not(.hidden)');
    const detailsTitle = await page.textContent('#detailsTitle');
    assert.match(detailsTitle || '', new RegExp(internshipTitle));

    await page.click('#detailsApplyBtn');
    await page.waitForSelector('#applyFormCard:not(.hidden)');
    await page.fill('#applyFullName', 'Test Student');
    await page.fill('#applyEmail', `student_${RUN_ID}@mail.com`);
    await page.fill('#applyPhone', '9876543210');
    await page.fill('#applyEducation', 'B.E');
    await page.fill('#applyQualification', '8.1 CGPA');
    await page.fill('#applySkills', 'JavaScript,Node.js');
    await page.fill('#applyResumeLink', 'https://example.com/resume.pdf');
    await page.fill('#applyCoverLetter', 'I am interested in this internship.');
    await page.click('#submitApplyBtn');

    await page.waitForSelector('#applyFormCard', { state: 'hidden', timeout: 20000 });
    await page.click('#loadApplicationsBtn');
    const appItem = page.locator('#applicationList li', { hasText: internshipTitle }).first();
    await appItem.waitFor({ state: 'visible', timeout: 20000 });

    await logoutToLanding(page);

    // 4) Admin logs in and approves student application.
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await loginAndEnterDashboard(page, {
      username: adminUser,
      password: 'Admin@1234',
      role: 'admin',
    });

    await page.click('#adminLoadApplicationsBtn');
    const adminApp = page.locator('#adminApplicationList li', { hasText: internshipTitle }).first();
    await adminApp.waitFor({ state: 'visible', timeout: 20000 });
    await adminApp.locator('button', { hasText: 'Approve' }).click();

    await logoutToLanding(page);

    // 5) Student logs in and verifies approval notification.
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section:not(.hidden)');
    await loginAndEnterDashboard(page, {
      username: studentUser,
      password: 'Stud1234',
      role: 'student',
    });

    await page.click('#loadNotificationsBtn');
    const notif = page.locator('#notificationList li', { hasText: 'approved' }).first();
    await notif.waitFor({ state: 'visible', timeout: 20000 });

    assert.ok(true, 'Real end-to-end flow succeeded through UI interactions.');
  } finally {
    await page.close();
    await browser.close();
  }
});

test('Local website automation: login with provided student credentials and validate key flows', async (t) => {
  if (!LOCAL_STUDENT_USERNAME || !LOCAL_STUDENT_PASSWORD) {
    t.skip('Set LOCAL_STUDENT_USERNAME and LOCAL_STUDENT_PASSWORD to run this credential-based local test.');
    return;
  }

  const headless = String(process.env.UI_HEADLESS || 'true').toLowerCase() === 'true';
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 180 });
  const page = await browser.newPage();

  page.on('dialog', async (dialog) => {
    await dialog.accept('ok');
  });

  try {
    // 1) Open your local site and login using provided credentials.
    await openAuth(page);
    await loginAndEnterDashboard(page, {
      username: LOCAL_STUDENT_USERNAME,
      password: LOCAL_STUDENT_PASSWORD,
      role: 'student',
    });

    // 2) Internship listing should load.
    await page.click('#loadInternshipsBtn');
    await page.waitForSelector('#internshipList li', { timeout: 20000 });
    const internshipCount = await page.locator('#internshipList li').count();
    assert.ok(internshipCount >= 1, 'Internship list did not render.');

    // 3) Search box should respond.
    await page.fill('#internshipSearchInput', 'web');
    await page.click('#loadInternshipsBtn');
    await page.waitForSelector('#internshipList li', { timeout: 20000 });

    // 4) Open details if a "View Details" button exists.
    const firstViewBtn = page.locator('#internshipList li button', { hasText: 'View Details' }).first();
    if ((await firstViewBtn.count()) > 0) {
      await firstViewBtn.click();
      await page.waitForSelector('#internshipDetailsCard:not(.hidden)', { timeout: 10000 });
      const title = await page.textContent('#detailsTitle');
      assert.ok((title || '').trim().length > 0, 'Details card opened without title.');
      await page.click('#closeDetailsBtn');
      await page.waitForSelector('#internshipDetailsCard.hidden', { timeout: 10000 });
    }

    // 5) Applications list should load.
    await page.click('#loadApplicationsBtn');
    await page.waitForSelector('#applicationList li', { timeout: 20000 });

    // 6) Notifications list should load.
    await page.click('#loadNotificationsBtn');
    await page.waitForSelector('#notificationList li', { timeout: 20000 });

    // 7) Logout check.
    await logoutToLanding(page);
    assert.ok(true, 'Credential-based local website flow completed successfully.');
  } finally {
    await page.close();
    await browser.close();
  }
});
