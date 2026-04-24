const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const UI_BASE = process.env.UI_BASE_URL || 'http://localhost:5500';
const RUN_ID = Date.now();

function isHidden(page, selector) {
  return page.$eval(selector, (el) => el.classList.contains('hidden'));
}

test('Step-by-step browser test opens page and runs student flow', async () => {
  const headless = String(process.env.UI_HEADLESS || 'false').toLowerCase() === 'true';
  const browser = await chromium.launch({
    headless,
    slowMo: headless ? 0 : 250,
  });

  const page = await browser.newPage();
  try {
    console.log('STEP 1: Open Internship Awareness page');
    await page.goto(UI_BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#landing');
    const title = await page.title();
    assert.match(title, /Internship Awareness System/i);

    console.log('STEP 2: Click Start Learning and open auth section');
    await page.click('#getStartedBtn');
    await page.waitForSelector('#auth-section');
    assert.equal(await isHidden(page, '#auth-section'), false);

    console.log('STEP 3: Register a new student user from UI');
    const username = `ui_student_${RUN_ID}`;
    await page.fill('#registerFullName', 'UI Student');
    await page.fill('#username', username);
    await page.fill('#password', 'Stud1234');
    await page.selectOption('#role', 'student');
    await page.click('#registerBtn');

    await page.waitForFunction(() => {
      const dash = document.getElementById('dashboard');
      return dash && !dash.classList.contains('hidden');
    });
    const dashboardTitle = await page.textContent('#dashboardTitle');
    assert.match(dashboardTitle || '', /STUDENT Dashboard/i);

    console.log('STEP 4: Load internships list from student panel');
    await page.click('#loadInternshipsBtn');
    await page.waitForSelector('#internshipList li');
    const items = await page.$$eval('#internshipList li', (els) => els.length);
    assert.ok(items >= 1, 'Expected internship list area to render at least one item/message');

    console.log('STEP 5: Logout from UI');
    await page.click('#logoutBtn');
    await page.waitForFunction(() => {
      const landing = document.getElementById('landing');
      return landing && !landing.classList.contains('hidden');
    });
  } finally {
    await page.close();
    await browser.close();
  }
});
