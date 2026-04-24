# 🚀 Quick Start - Automated Testing

## Run Tests in 3 Steps

### Step 1: Start Backend
```bash
npm start
```
Backend runs on `http://localhost:5000`

### Step 2: Start Frontend (for UI tests)
```bash
# In another terminal, serve frontend on port 5500
# Example using Python:
python -m http.server 5500 -d frontend

# Or using Node (if http-server installed):
npx http-server frontend -p 5500
```

### Step 3: Run Tests
```bash
# Run all comprehensive tests (API + UI)
npm run test:comprehensive

# Or run only API tests (faster)
npm run test:comprehensive:api

# Or run only UI tests
npm run test:comprehensive:ui
```

---

## Test Commands Summary

| Command | What It Does | Time |
|---------|---|---|
| `npm run test:comprehensive:api` | 65+ API tests only | ~1 min |
| `npm run test:comprehensive:ui` | 40+ UI tests only | ~3-5 min |
| `npm run test:comprehensive` | All tests with report | ~5-6 min |
| `npm run test:comprehensive:no-ui` | API tests without UI | ~1 min |
| `npm run test:complete` | Everything (all suites) | ~10 min |

---

## Test Files Created

```
testing/
├── api/
│   └── comprehensive-test-suite.cjs      (65+ API tests)
├── ui/
│   └── comprehensive-ui-flows.test.cjs   (40+ UI tests)
├── run-comprehensive-tests.cjs           (Test runner with report)
├── COMPREHENSIVE_TEST_GUIDE.md           (Full documentation)
└── QUICK_START.md                        (This file)
```

---

## What Gets Tested

✅ **Login** (7 tests)
- Valid/invalid credentials, empty fields, case sensitivity, session management

✅ **Sign-up** (7 tests)
- Registration flow, field validation, duplicate prevention

✅ **Browse Internships** (7 tests)
- List loading, search, filters, sorting, active internships

✅ **View Details** (7 tests)
- Detail page, content display, contact links, navigation

✅ **Apply** (7 tests)
- Login requirement, form validation, resume upload, deadline

✅ **Awareness Content** (7 tests)
- FAQs, resources, search, images, layout

✅ **Notifications** (7 tests)
- Display, reminders, settings, user isolation

✅ **Admin** (7 tests)
- Admin login, dashboard, CRUD operations, access control

✅ **User Flows** (40+ tests)
- Complete journeys, responsive design, interactions

---

## Troubleshooting

### Backend Not Starting?
```bash
# Check if port 5000 is free
netstat -an | grep 5000

# Try different port
TEST_BASE_URL=http://localhost:5001 npm run test:comprehensive:api
```

### Frontend Can't Be Reached?
```bash
# Make sure frontend is served on port 5500
# Test it:
curl http://localhost:5500

# If not working, ensure index.html exists at:
ls frontend/index.html
```

### Tests Timing Out?
- Increase timeout in test files
- Check system resources
- Reduce background processes

### A Specific Test Fails?
1. Run just that file:
   ```bash
   node --test testing/api/comprehensive-test-suite.cjs
   ```
2. Read the error message
3. Check the documented issue below

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Cannot find module 'playwright'` | `npm install playwright` |
| `ECONNREFUSED` on port 5000 | Start backend: `npm start` |
| `ECONNREFUSED` on port 5500 | Start frontend server on port 5500 |
| Tests timeout | Increase `waitForTimeout` values |
| Database connection fails | Check MongoDB is running |

---

## Sample Test Output

```
✓ LOGIN: Valid username and password allow user to log in successfully
✓ LOGIN: Wrong password shows error message
✓ LOGIN: Wrong username shows error message
✓ LOGIN: Empty username prevents form submission
✓ LOGIN: Empty password prevents form submission
✓ LOGIN: Username and password are case-sensitive
✓ LOGIN: After login user has valid session token

✓ SIGNUP: New user can register with valid details
✓ SIGNUP: Name field validation (only letters and spaces)
✓ SIGNUP: Username with special characters validation
✓ SIGNUP: Email must be in valid email format
✓ SIGNUP: Phone number must be exactly 10 digits
✓ SIGNUP: Password must meet minimum rules and all fields must be filled
✓ SIGNUP: Duplicate email or username prevents duplicate registration

[... more tests ...]

✓ PASSED - API Tests
✓ PASSED - UI Tests

Total: 2/2 test suites passed
Time: 285s

🎉 ALL TESTS PASSED! 🎉
```

---

## Understanding Test Results

### ✓ PASSED
Test executed successfully - feature works as expected

### ✗ FAILED
Test did not pass - review error message for details

### ⚠ SKIPPED
Test was skipped (usually needs special setup)

---

## For CI/CD Integration

### Environment Variables
```bash
# Customize API URL
TEST_BASE_URL=http://your-api:5000

# Customize Frontend URL
UI_BASE_URL=http://your-frontend:5500

# Skip server health check
SKIP_SERVER_CHECK=true

# Run only API tests (faster)
RUN_UI_TESTS=false
```

### Example: GitHub Actions
```yaml
- name: Run Tests
  env:
    TEST_BASE_URL: http://localhost:5000
    UI_BASE_URL: http://localhost:5500
  run: npm run test:comprehensive:api
```

---

## Test Architecture

```
┌─────────────────────────────────┐
│   HTTP Client / Browser         │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   API Tests     UI Tests
  (Node.js)     (Playwright)
      │             │
      └──────┬──────┘
             │
    ┌────────┴────────┐
    │                 │
Backend API        Frontend
:5000              :5500
```

---

## Next Steps

1. ✅ Create backend server (`npm start`)
2. ✅ Create frontend server (port 5500)
3. ✅ Run tests (`npm run test:comprehensive`)
4. ✅ Check results and fix any failures
5. ✅ Integrate into CI/CD pipeline

---

## Need More Details?

See [COMPREHENSIVE_TEST_GUIDE.md](COMPREHENSIVE_TEST_GUIDE.md) for:
- Detailed test coverage
- How to write new tests
- Performance optimization
- Debugging strategies
- CI/CD integration examples

---

**Happy Testing! 🧪**
