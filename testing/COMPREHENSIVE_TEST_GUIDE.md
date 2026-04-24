# 🧪 Comprehensive Test Suite Documentation

## Overview

This document describes the automated test suites covering all major functionalities of the Internship Awareness System. The tests are **100% automated** and use **Playwright** (no Selenium) for UI testing and **Node.js native test framework** for API testing.

---

## Test Coverage Summary

### ✅ Total Tests: 105+

| Test Category | Tests | Coverage |
|---|---|---|
| **1. Login** | 7 tests | Valid/wrong credentials, empty fields, case sensitivity, session management |
| **2. Sign-up/Registration** | 7 tests | Valid registration, field validation, email/phone format, duplicates |
| **3. Browse & Search Internships** | 7 tests | List loading, search, filters, sorting, active internships |
| **4. Internship Details** | 7 tests | Detail page loading, content display, contact links, back navigation |
| **5. Applications** | 7 tests | Login requirement, form validation, resume upload, duplicates, deadline |
| **6. Awareness Content** | 7 tests | FAQs/articles, external links, search, images, layout, related links |
| **7. Notifications** | 7 tests | Notification display, reminders, settings, user isolation, clarity |
| **8. Admin Features** | 7 tests | Admin login, dashboard access, add/edit/delete internships, applications |
| **UI Flows** | 40+ tests | Complete user journeys, responsive design, interactive flows |
| **Session Management** | 2 tests | Logout functionality, protected page access |

---

## Test Files

### API Tests
**File:** `testing/api/comprehensive-test-suite.cjs`

- **65+ API tests** covering all backend endpoints
- Tests authentication, CRUD operations, validation, error handling
- Uses Node.js `test` module and Fetch API
- Organized by functionality (Login, Signup, Internships, Applications, Admin, etc.)

**Key Test Areas:**
```
✓ Authentication (7 tests)
  - Valid credentials, wrong password/username
  - Empty fields validation
  - Case sensitivity
  - Token-based session management

✓ User Registration (7 tests)
  - Valid registration flow
  - Field validation (name, email, phone, password)
  - Duplicate prevention
  - Password strength requirements

✓ Internship Management (21 tests)
  - List all internships
  - Search by keyword
  - Filters (domain, location, duration)
  - Sorting
  - Detailed view
  - Status checking (active/open)

✓ Applications (7 tests)
  - Login requirement enforcement
  - Required field validation
  - Resume upload handling
  - Duplicate application prevention
  - Deadline enforcement

✓ Admin Operations (7 tests)
  - Admin authentication
  - CRUD for internships
  - Application management
  - Access control
```

### UI Tests
**File:** `testing/ui/comprehensive-ui-flows.test.cjs`

- **40+ UI tests** using Playwright browser automation
- Tests user interactions, form submissions, navigation
- Tests responsive design (mobile, tablet, desktop)
- Includes complete end-to-end student flow

**Key Test Areas:**
```
✓ Login Interface (7 tests)
  - Form submission
  - Error message display
  - Empty field handling
  - Navigation to dashboard

✓ Registration Interface (7 tests)
  - Form filling and validation
  - Visual feedback
  - Field-specific validation errors

✓ Internship Browsing (7 tests)
  - List rendering
  - Search functionality
  - Filter application
  - Sorting UI
  - Detail page navigation

✓ Applications UI (7 tests)
  - Apply button visibility
  - Form rendering
  - File upload handling
  - Success messages

✓ User Flows (12+ tests)
  - Complete signup → browse → apply flow
  - Responsive design (mobile/tablet)
  - Logout and re-login flow
  - Page navigation

✓ Admin UI (5 tests)
  - Admin dashboard access
  - Add internship form
  - Applications view
  - Access control verification
```

---

## How to Run Tests

### Prerequisites
1. **Backend server running:**
   ```bash
   npm start
   ```
   (Listens on `http://localhost:5000`)

2. **Frontend server running:**
   - For UI tests, ensure frontend is accessible at `http://localhost:5500`
   - You can use any static server (e.g., `http-server`, `live-server`)

3. **Environment variables (optional):**
   ```bash
   TEST_BASE_URL=http://localhost:5000     # API URL
   UI_BASE_URL=http://localhost:5500       # Frontend URL
   RUN_UI_TESTS=true                       # Include UI tests (default: true)
   ```

### Running Tests

#### 1. **Comprehensive API Tests Only**
```bash
npm run test:comprehensive:api
```
Runs 65+ API tests (fast, ~30-60 seconds)

#### 2. **Comprehensive UI Tests Only**
```bash
npm run test:comprehensive:ui
```
Runs 40+ UI tests with Playwright (slower, ~2-5 minutes)

#### 3. **All Comprehensive Tests** (Recommended)
```bash
npm run test:comprehensive
```
Runs both API and UI tests with beautiful summary report

#### 4. **API Tests Only (No UI)**
```bash
npm run test:comprehensive:no-ui
```
Quick run excluding UI tests

#### 5. **Run ALL Tests** (Including original tests)
```bash
npm run test:complete
```
Runs comprehensive suite + original test suite

#### 6. **Individual Test Files**
```bash
# API tests
node --test testing/api/comprehensive-test-suite.cjs

# UI tests
node --test testing/ui/comprehensive-ui-flows.test.cjs

# With custom environment
TEST_BASE_URL=http://custom:5000 node --test testing/api/comprehensive-test-suite.cjs
```

---

## Test Output Example

```
╔════════════════════════════════════════════════════╗
║         COMPREHENSIVE TEST SUITE RUNNER            ║
╚════════════════════════════════════════════════════╝

📋 Test Configuration:
   • API Tests: ENABLED (65+ tests)
   • UI Tests: ENABLED (40+ tests)
   • Total: 105+ tests

🔍 Checking required servers...
✓ Backend API (port 5000) is running
✓ Frontend UI (port 5500) is running

[API Tests]
► Running comprehensive API test suite (65+ tests)...

LOGIN UI: Valid credentials allow successful login
✓ LOGIN: Valid username and password allow user to log in successfully
✓ LOGIN: Wrong password shows error message
... (more tests)

[UI Tests]
► Running comprehensive UI test suite (40+ tests)...
✓ PASSED - API Tests
✓ PASSED - UI Tests

╔════════════════════════════════════════════════════╗
║                    TEST SUMMARY                    ║
╚════════════════════════════════════════════════════╝

✓ PASSED - API Tests
✓ PASSED - UI Tests

Total: 2/2 test suites passed
Time: 345s

🎉 ALL TESTS PASSED! 🎉
```

---

## Test Requirements Coverage

### 1. ✅ LOGIN (7 tests)
- [x] Valid username and password allow login
- [x] Wrong password shows error
- [x] Wrong username shows error
- [x] Empty username prevents submission
- [x] Empty password prevents submission
- [x] Case sensitivity verification
- [x] Valid session after login

### 2. ✅ SIGN-UP / REGISTRATION (7 tests)
- [x] New user can register with valid details
- [x] Name field validation (letters and spaces)
- [x] Username with special characters handling
- [x] Email must be valid format
- [x] Phone number exactly 10 digits
- [x] Password meets minimum requirements
- [x] Duplicate email/username prevention

### 3. ✅ BROWSE & SEARCH INTERNSHIPS (7 tests)
- [x] List loads without errors
- [x] Search by keyword shows matches
- [x] Filter by domain, location, duration
- [x] No results shows helpful message
- [x] List items show title, company, deadline
- [x] Sorting available (date, company)
- [x] Only active internships shown

### 4. ✅ INTERNSHIP DETAILS (7 tests)
- [x] Clicking item opens full details
- [x] Shows description, eligibility, skills, duration
- [x] Shows deadline and stipend
- [x] Apply button shows when open
- [x] Missing data shown safely
- [x] Contact links work correctly
- [x] Back navigation returns to list

### 5. ✅ APPLICATIONS (7 tests)
- [x] User must be logged in to apply
- [x] Required fields cannot be empty
- [x] Resume upload with validation
- [x] Confirmation message after submission
- [x] Cannot apply twice to same internship
- [x] Application appears in My Applications
- [x] Blocked after closing date

### 6. ✅ AWARENESS CONTENT (7 tests)
- [x] FAQs and articles load and display
- [x] External guide links work
- [x] Search inside FAQs/resources
- [x] Only published content visible
- [x] Images/videos load without breaking
- [x] Empty sections don't break layout
- [x] Related links work correctly

### 7. ✅ NOTIFICATIONS (7 tests)
- [x] User receives notifications for new matches
- [x] Email/in-app reminders before deadline
- [x] Toggle notifications on/off with save
- [x] Wrong user doesn't get another's alerts
- [x] Notification text is clear
- [x] No duplicate notifications
- [x] Opening notification goes to correct page

### 8. ✅ ADMIN (7 tests)
- [x] Admin login with correct credentials
- [x] Wrong credentials show error
- [x] Add new internship (appears for students)
- [x] Edit internship (updates for all)
- [x] Delete/hide internship (removes from list)
- [x] View list of applications
- [x] Normal students cannot access admin

### 9. ✅ SESSION MANAGEMENT (2 tests)
- [x] User can log out (session ends)
- [x] After logout cannot access protected pages

---

## Debugging Failed Tests

### When API Tests Fail

1. **Check backend is running:**
   ```bash
   npm start
   ```

2. **Verify database connection:**
   - Check MongoDB is running
   - Check `backend/config/db.js` configuration

3. **View detailed error:**
   ```bash
   TEST_BASE_URL=http://localhost:5000 node --test testing/api/comprehensive-test-suite.cjs
   ```

4. **Check authentication:**
   - Verify JWT secret is configured
   - Check token generation in `backend/routes/auth.js`

### When UI Tests Fail

1. **Check frontend is accessible:**
   ```bash
   curl http://localhost:5500
   ```

2. **Use headless=false for debugging:**
   Edit `comprehensive-ui-flows.test.cjs`:
   ```javascript
   const browser = await chromium.launch({ headless: false });
   ```

3. **Check element selectors:**
   - Verify form input names match (e.g., `name="username"`)
   - Check button IDs and classes exist
   - Use browser DevTools to inspect elements

4. **Increase timeouts:**
   ```javascript
   await page.waitForTimeout(2000); // Increase if tests timeout
   ```

---

## Test Architecture

### API Test Flow
```
1. Generate unique test data (timestamps-based IDs)
2. Register test user/company
3. Authenticate (get JWT token)
4. Test endpoint
5. Verify response status and data
6. Clean up (optional)
```

### UI Test Flow
```
1. Launch Chromium browser (headless mode)
2. Navigate to page
3. Wait for elements to load
4. Fill form fields
5. Click buttons
6. Verify page state/navigation
7. Close browser
```

---

## Performance & Timing

| Test Suite | Count | Typical Duration | Hardware |
|---|---|---|---|
| API Tests Only | 65+ | 30-60 seconds | Any |
| UI Tests Only | 40+ | 2-5 minutes | 4GB+ RAM, SSD |
| All Tests | 105+ | 3-6 minutes | 4GB+ RAM, SSD |

**Tips for faster execution:**
- Run API tests only if UI testing is not needed
- Disable UI tests with `RUN_UI_TESTS=false`
- Use SSD for faster Playwright startup
- Run in headless mode (default)

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'}"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm start &
      - run: npm run test:comprehensive:api
```

---

## Troubleshooting

### Common Issues

#### "Cannot find module 'playwright'"
```bash
npm install playwright
```

#### "Port 5000 already in use"
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
TEST_BASE_URL=http://localhost:5001 npm run test:comprehensive:api
```

#### "ECONNREFUSED 127.0.0.1:27017"
- MongoDB not running
- Start MongoDB: `mongod` or use Docker

#### Tests timeout
- Increase timeout in test files
- Check network connectivity
- Reduce system load

#### Specific test fails
- Run individual test file
- Check error message for specifics
- Verify test prerequisites

---

## Writing Additional Tests

### Add API Test
```javascript
test('FEATURE: Description of test', async () => {
  const payload = { /* test data */ };
  const res = await post('/endpoint', payload);
  assert.equal(res.status, 200);
  assert.ok(res.json.expectedField);
});
```

### Add UI Test
```javascript
test('FEATURE UI: Description', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(UI_BASE);
    await page.fill('input[name="field"]', 'value');
    await page.click('button[type="submit"]');
    
    const result = await page.$('.success');
    assert.ok(result !== null);
  } finally {
    await page.close();
    await browser.close();
  }
});
```

---

## Reporting Issues

When reporting test failures, include:

1. **Error message:** Full error output
2. **Test name:** Which test failed
3. **Environment:**
   - OS (Windows/Mac/Linux)
   - Node.js version: `node --version`
   - Playwright version: `npm ls playwright`
4. **Server status:**
   - Backend running? Port 5000 accessible?
   - Frontend running? Port 5500 accessible?
5. **Steps to reproduce:**
   - Which test command was run
   - Any custom environment variables

---

## Summary

✅ **105+ automated tests** covering all major features  
✅ **No Selenium** - Uses Playwright for speed  
✅ **Fast execution** - API tests in ~1 minute  
✅ **Easy to run** - Single npm command  
✅ **Comprehensive** - Covers happy path + edge cases  
✅ **Maintainable** - Well-organized, documented code  

**Ready to run:**
```bash
npm run test:comprehensive
```

Happy testing! 🚀
