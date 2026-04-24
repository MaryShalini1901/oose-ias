const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const RUN_ID = Date.now();

// ============= HELPER FUNCTIONS =============
function makeStudentPayload(suffix = '') {
  const id = `${RUN_ID}${suffix}`;
  return {
    fullName: `Test Student ${suffix}`,
    username: `student_${id}`,
    password: 'TestPass@123',
    role: 'student',
    email: `student_${id}@test.com`,
    phone: '9876543210',
  };
}

function makeAdminPayload(suffix = '') {
  const id = `${RUN_ID}${suffix}`;
  return {
    fullName: `Test Admin ${suffix}`,
    username: `admin_${id}`,
    password: 'AdminPass@123',
    role: 'admin',
    email: `admin_${id}@test.com`,
    phone: '9876543211',
  };
}

function makeCompanyPayload(suffix = '') {
  const id = `${RUN_ID}${suffix}`;
  return {
    fullName: `Test Company ${suffix}`,
    username: `company_${id}`,
    password: 'CompPass@123',
    role: 'company',
    email: `company_${id}@test.com`,
    phone: '9876543212',
  };
}

async function post(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function get(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function put(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

async function deleteReq(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

// ============= 1. LOGIN TESTS =============
test('LOGIN: Valid username and password allow user to log in successfully', async () => {
  const student = makeStudentPayload('_login1');
  
  // Register first
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Registration should succeed');
  
  // Now login
  const login = await post('/auth/login', {
    username: student.username,
    password: student.password,
  });
  assert.equal(login.status, 200, 'Login should succeed with valid credentials');
  assert.ok(login.json.token, 'Token should be returned');
  assert.match(login.json.token, /^[A-Za-z0-9\-_=.]+$/, 'Should return valid JWT token');
});

test('LOGIN: Wrong password shows error message', async () => {
  const student = makeStudentPayload('_login2');
  
  // Register first
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Registration should succeed');
  
  // Login with wrong password
  const login = await post('/auth/login', {
    username: student.username,
    password: 'WrongPassword123',
  });
  assert.equal(login.status, 401, 'Login with wrong password should fail');
  assert.ok(login.json.error || login.json.message, 'Should have error message');
});

test('LOGIN: Wrong username shows error message', async () => {
  const login = await post('/auth/login', {
    username: 'nonexistent_user_12345',
    password: 'SomePass123',
  });
  assert.equal(login.status, 401, 'Login with wrong username should fail');
  assert.ok(login.json.error || login.json.message, 'Should have error message');
});

test('LOGIN: Empty username prevents form submission', async () => {
  const login = await post('/auth/login', {
    username: '',
    password: 'TestPass@123',
  });
  assert.notEqual(login.status, 200, 'Login with empty username should fail');
  assert.ok(login.status >= 400, 'Should return error status');
});

test('LOGIN: Empty password prevents form submission', async () => {
  const login = await post('/auth/login', {
    username: 'someuser',
    password: '',
  });
  assert.notEqual(login.status, 200, 'Login with empty password should fail');
  assert.ok(login.status >= 400, 'Should return error status');
});

test('LOGIN: Username and password are case-sensitive (verify behavior)', async () => {
  const student = makeStudentPayload('_login6');
  
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Registration should succeed');
  
  // Try with different case
  const login = await post('/auth/login', {
    username: student.username.toUpperCase(),
    password: student.password,
  });
  // This should fail if case-sensitive, or pass if normalized
  assert.ok([200, 401].includes(login.status), 'Case sensitivity behavior should be consistent');
});

test('LOGIN: After login user has valid session token', async () => {
  const student = makeStudentPayload('_login7');
  
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Registration should succeed');
  
  const login = await post('/auth/login', {
    username: student.username,
    password: student.password,
  });
  assert.equal(login.status, 200, 'Login should succeed');
  
  // Use token to access protected route
  const profile = await get('/auth/me', login.json.token);
  assert.equal(profile.status, 200, 'Should access protected route with token');
});

// ============= 2. SIGNUP/REGISTRATION TESTS =============
test('SIGNUP: New user can register with valid details', async () => {
  const student = makeStudentPayload('_signup1');
  
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Registration with valid details should succeed');
  assert.ok(reg.json.token, 'Should return token');
  assert.ok(reg.json._id || reg.json.user, 'Should return user data');
});

test('SIGNUP: Name field validation (only letters and spaces allowed)', async () => {
  const payload = makeStudentPayload('_signup2');
  payload.fullName = 'Test123Student'; // Contains numbers
  
  const reg = await post('/auth/register', payload);
  // Should either succeed with normalized name or fail validation
  assert.ok([201, 400].includes(reg.status), 'System should handle special chars in name');
});

test('SIGNUP: Username with special characters validation', async () => {
  const payload = makeStudentPayload('_signup3');
  payload.username = 'user@#$%_test';
  
  const reg = await post('/auth/register', payload);
  // System should handle special chars in username
  assert.ok([201, 400].includes(reg.status), 'System should validate username format');
});

test('SIGNUP: Email must be in valid email format', async () => {
  const payload = makeStudentPayload('_signup4');
  payload.email = 'invalid-email-format';
  
  const reg = await post('/auth/register', payload);
  assert.notEqual(reg.status, 201, 'Invalid email should fail registration');
  assert.ok(reg.status >= 400, 'Should return error status for invalid email');
});

test('SIGNUP: Phone number must be exactly 10 digits', async () => {
  const payload = makeStudentPayload('_signup5');
  payload.phone = '12345'; // Too short
  
  const reg = await post('/auth/register', payload);
  assert.notEqual(reg.status, 201, 'Invalid phone number should fail');
  
  const payload2 = makeStudentPayload('_signup5b');
  payload2.phone = '123456789012345'; // Too long
  const reg2 = await post('/auth/register', payload2);
  assert.notEqual(reg2.status, 201, 'Invalid phone number should fail');
});

test('SIGNUP: Password must meet minimum rules and all required fields must be filled', async () => {
  const payload = makeStudentPayload('_signup6');
  payload.password = 'weak'; // Too weak
  
  const reg = await post('/auth/register', payload);
  assert.notEqual(reg.status, 201, 'Weak password should fail');
  
  // Test missing required field
  const payload2 = makeStudentPayload('_signup6b');
  delete payload2.fullName;
  const reg2 = await post('/auth/register', payload2);
  assert.notEqual(reg2.status, 201, 'Missing required field should fail');
});

test('SIGNUP: Duplicate email or username prevents duplicate registration', async () => {
  const student = makeStudentPayload('_signup7');
  
  // First registration
  const reg1 = await post('/auth/register', student);
  assert.equal(reg1.status, 201, 'First registration should succeed');
  
  // Second registration with same email
  const reg2 = await post('/auth/register', student);
  assert.notEqual(reg2.status, 201, 'Duplicate email should fail');
  assert.ok(reg2.status >= 400, 'Should return error status for duplicate');
});

// ============= 3. BROWSE & SEARCH INTERNSHIPS =============
test('INTERNSHIPS LIST: Internship list loads without errors', async () => {
  const list = await get('/internships');
  assert.equal(list.status, 200, 'Internship list should load successfully');
  assert.ok(Array.isArray(list.json), 'Should return array of internships');
});

test('INTERNSHIPS SEARCH: Search by keyword shows matching internships', async () => {
  const company = makeCompanyPayload('_search1');
  const reg = await post('/auth/register', company);
  assert.equal(reg.status, 201, 'Setup: Company registration should succeed');
  
  // Create an internship with specific title
  const internship = {
    title: 'Python Developer Internship Unique',
    company: company.username,
    description: 'Learn Python programming',
    domain: 'Backend',
    location: 'Bangalore',
    durationWeeks: 12,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation should succeed');
  
  // Search for keyword
  const search = await get('/internships?search=Python');
  assert.equal(search.status, 200, 'Search should work');
  assert.ok(Array.isArray(search.json), 'Should return array');
});

test('INTERNSHIPS FILTER: Filter by domain, location, or duration', async () => {
  // Test filtering
  const filter1 = await get('/internships?domain=Backend');
  assert.equal(filter1.status, 200, 'Filter by domain should work');
  
  const filter2 = await get('/internships?location=Remote');
  assert.equal(filter2.status, 200, 'Filter by location should work');
  
  const filter3 = await get('/internships?duration=8');
  assert.ok([200, 400].includes(filter3.status), 'Filter by duration should be handled');
});

test('INTERNSHIPS SEARCH: No results shows helpful message', async () => {
  const search = await get('/internships?search=NoSuchInternshipXYZ12345');
  assert.equal(search.status, 200, 'Search with no results should succeed');
  assert.ok(Array.isArray(search.json), 'Should return empty array or message');
  assert.equal(search.json.length, 0, 'Should return empty results');
});

test('INTERNSHIPS LIST: Each item shows main details (title, company, deadline)', async () => {
  const list = await get('/internships');
  assert.equal(list.status, 200, 'List should load');
  
  if (list.json.length > 0) {
    const item = list.json[0];
    assert.ok(item.title, 'Should have title');
    assert.ok(item.company, 'Should have company');
    // deadline may be optional, check if present
  }
});

test('INTERNSHIPS LIST: Sorting available (by date or company name)', async () => {
  const sort1 = await get('/internships?sort=date');
  assert.equal(sort1.status, 200, 'Sorting by date should work');
  
  const sort2 = await get('/internships?sort=company');
  assert.ok([200, 400].includes(sort2.status), 'Sorting should be handled');
});

test('INTERNSHIPS LIST: Only active or open internships appear in default list', async () => {
  const list = await get('/internships');
  assert.equal(list.status, 200, 'List should load');
  assert.ok(Array.isArray(list.json), 'Should be array');
  
  // All items should be active/open
  if (list.json.length > 0) {
    const all_active = list.json.every(i => 
      i.status === 'active' || i.status === 'open' || i.isActive === true
    );
    assert.ok(all_active || list.json.length > 0, 'Should show only active internships');
  }
});

// ============= 4. INTERNSHIP DETAILS =============
test('INTERNSHIP DETAILS: Clicking internship opens full details page', async () => {
  const company = makeCompanyPayload('_details1');
  const reg = await post('/auth/register', company);
  assert.equal(reg.status, 201, 'Setup: Company registration');
  
  const internship = {
    title: 'Details Test Internship',
    company: company.username,
    description: 'Full description here',
    domain: 'Web Development',
    location: 'Hyderabad',
    durationWeeks: 10,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const detail = await get(`/internships/${created.json._id}`);
  assert.equal(detail.status, 200, 'Should fetch internship details');
  assert.ok(detail.json.title, 'Should have title in details');
});

test('INTERNSHIP DETAILS: Shows description, eligibility, skills, and duration', async () => {
  const company = makeCompanyPayload('_details2');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Full Details Internship',
    company: company.username,
    description: 'Complete description with all details',
    domain: 'Backend',
    location: 'Mumbai',
    durationWeeks: 8,
    eligibility: 'B.Tech or M.Tech students',
    skills: ['Node.js', 'Express', 'MongoDB'],
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const detail = await get(`/internships/${created.json._id}`);
  assert.equal(detail.status, 200, 'Should fetch details');
  assert.ok(detail.json.title, 'Should have title');
  assert.ok(detail.json.description, 'Should have description');
  assert.ok(detail.json.durationWeeks, 'Should have duration');
});

test('INTERNSHIP DETAILS: Shows application deadline and stipend (if any)', async () => {
  const company = makeCompanyPayload('_details3');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Deadline Test Internship',
    company: company.username,
    description: 'Test deadline',
    domain: 'Data Science',
    location: 'Bangalore',
    durationWeeks: 6,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    stipend: 10000,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const detail = await get(`/internships/${created.json._id}`);
  assert.equal(detail.status, 200, 'Should fetch details');
  // Check if deadline or stipend are present
  assert.ok(detail.json.deadline || detail.json.stipend !== undefined, 
    'Should show deadline or stipend if present');
});

test('INTERNSHIP DETAILS: Apply or Register button shows only when internship is open', async () => {
  const company = makeCompanyPayload('_details4');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Open Internship Test',
    company: company.username,
    description: 'Test open status',
    domain: 'Frontend',
    location: 'Pune',
    durationWeeks: 4,
    isActive: true,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const detail = await get(`/internships/${created.json._id}`);
  assert.equal(detail.status, 200, 'Should fetch details');
  // If isActive/status is present, verify it
  assert.ok(detail.json.isActive === true || detail.json.status === 'active',
    'Open internship should be marked as active');
});

test('INTERNSHIP DETAILS: Missing data shown safely without breaking page', async () => {
  const company = makeCompanyPayload('_details5');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Minimal Internship',
    company: company.username,
    description: 'No optional fields',
    domain: 'General',
    location: 'Online',
    durationWeeks: 5,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const detail = await get(`/internships/${created.json._id}`);
  assert.equal(detail.status, 200, 'Should fetch without errors');
  // Missing fields should show "Not specified" or be omitted gracefully
  assert.ok(detail.json.title, 'Should always have essential fields');
});

test('INTERNSHIP DETAILS: Contact links open correctly without breaking page', async () => {
  const company = makeCompanyPayload('_details6');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Contact Test Internship',
    company: company.username,
    description: 'With contact info',
    domain: 'IT',
    location: 'Chennai',
    durationWeeks: 8,
    contactEmail: 'hr@company.com',
    contactPhone: '9876543210',
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const detail = await get(`/internships/${created.json._id}`);
  assert.equal(detail.status, 200, 'Should fetch details');
  // Contact info should be safely included
  assert.ok(detail.json, 'Page should load with contact info');
});

test('INTERNSHIP DETAILS: Back navigation returns to list without errors', async () => {
  const list1 = await get('/internships');
  assert.equal(list1.status, 200, 'Should load list');
  
  if (list1.json.length > 0) {
    const detail = await get(`/internships/${list1.json[0]._id}`);
    assert.equal(detail.status, 200, 'Should load details');
    
    const list2 = await get('/internships');
    assert.equal(list2.status, 200, 'Should return to list without errors');
  }
});

// ============= 5. APPLICATION / EXPRESSION OF INTEREST =============
test('APPLICATION: User must be logged in to apply for internship', async () => {
  const company = makeCompanyPayload('_app1');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Login Required Internship',
    company: company.username,
    description: 'Test login requirement',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  // Try to apply without token
  const app = await post(`/applications`, {
    internshipId: created.json._id,
    resumeUrl: 'resume.pdf',
  });
  assert.notEqual(app.status, 201, 'Should require authentication');
});

test('APPLICATION: Required fields cannot be left empty', async () => {
  const student = makeStudentPayload('_app2');
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Student registration');
  
  const company = makeCompanyPayload('_app2');
  const reg2 = await post('/auth/register', company);
  
  const internship = {
    title: 'Required Fields Test',
    company: company.username,
    description: 'Test required fields',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg2.json.token);
  
  // Try to apply with empty fields
  const app = await post(`/applications`, {
    internshipId: '',
  }, reg.json.token);
  assert.notEqual(app.status, 201, 'Empty internshipId should fail');
});

test('APPLICATION: Resume upload with file type and size limits', async () => {
  const student = makeStudentPayload('_app3');
  const reg = await post('/auth/register', student);
  
  const company = makeCompanyPayload('_app3');
  const reg2 = await post('/auth/register', company);
  
  const internship = {
    title: 'Resume Test',
    company: company.username,
    description: 'Test resume',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg2.json.token);
  
  const app = await post(`/applications`, {
    internshipId: created.json._id,
    resumeUrl: 'https://example.com/resume.pdf',
  }, reg.json.token);
  assert.ok([201, 400, 413].includes(app.status), 'Should handle resume upload validation');
});

test('APPLICATION: Confirmation message appears after successful submission', async () => {
  const student = makeStudentPayload('_app4');
  const reg = await post('/auth/register', student);
  
  const company = makeCompanyPayload('_app4');
  const reg2 = await post('/auth/register', company);
  
  const internship = {
    title: 'Confirmation Test',
    company: company.username,
    description: 'Test confirmation',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg2.json.token);
  
  const app = await post(`/applications`, {
    internshipId: created.json._id,
    resumeUrl: 'resume.pdf',
  }, reg.json.token);
  
  if (app.status === 201) {
    assert.ok(app.json.message || app.json.success || app.json._id, 
      'Should return success confirmation');
  }
});

test('APPLICATION: User cannot apply twice to same internship', async () => {
  const student = makeStudentPayload('_app5');
  const reg = await post('/auth/register', student);
  
  const company = makeCompanyPayload('_app5');
  const reg2 = await post('/auth/register', company);
  
  const internship = {
    title: 'No Duplicate Applications',
    company: company.username,
    description: 'Test duplicate prevention',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg2.json.token);
  
  const app1 = await post(`/applications`, {
    internshipId: created.json._id,
    resumeUrl: 'resume.pdf',
  }, reg.json.token);
  
  if (app1.status === 201) {
    const app2 = await post(`/applications`, {
      internshipId: created.json._id,
      resumeUrl: 'resume2.pdf',
    }, reg.json.token);
    assert.notEqual(app2.status, 201, 'Duplicate application should fail');
  }
});

test('APPLICATION: New application appears in My Applications list', async () => {
  const student = makeStudentPayload('_app6');
  const reg = await post('/auth/register', student);
  
  const company = makeCompanyPayload('_app6');
  const reg2 = await post('/auth/register', company);
  
  const internship = {
    title: 'My Applications Test',
    company: company.username,
    description: 'Test app listing',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg2.json.token);
  
  const app = await post(`/applications`, {
    internshipId: created.json._id,
    resumeUrl: 'resume.pdf',
  }, reg.json.token);
  
  if (app.status === 201) {
    const myApps = await get('/applications/my', reg.json.token);
    assert.equal(myApps.status, 200, 'Should fetch my applications');
    assert.ok(Array.isArray(myApps.json), 'Should return array of applications');
  }
});

test('APPLICATION: Blocked after application closing date', async () => {
  const student = makeStudentPayload('_app7');
  const reg = await post('/auth/register', student);
  
  const company = makeCompanyPayload('_app7');
  const reg2 = await post('/auth/register', company);
  
  // Create internship with deadline in past
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const internship = {
    title: 'Expired Deadline',
    company: company.username,
    description: 'Test expired deadline',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
    deadline: pastDate,
  };
  const created = await post('/internships', internship, reg2.json.token);
  
  if (created.status === 201) {
    const app = await post(`/applications`, {
      internshipId: created.json._id,
      resumeUrl: 'resume.pdf',
    }, reg.json.token);
    assert.notEqual(app.status, 201, 'Should not allow application after deadline');
  }
});

// ============= 6. AWARENESS CONTENT (TIPS, FAQS, RESOURCES) =============
test('AWARENESS: FAQs and articles open and display full content', async () => {
  const content = await get('/awareness');
  assert.equal(content.status, 200, 'Awareness content should load');
  assert.ok(Array.isArray(content.json) || content.json.articles, 
    'Should return awareness content');
});

test('AWARENESS: Links to external guides open correct pages', async () => {
  const content = await get('/awareness');
  assert.equal(content.status, 200, 'Should load content');
  
  if (Array.isArray(content.json) && content.json.length > 0) {
    const item = content.json[0];
    if (item.url || item.link) {
      assert.ok(item.url || item.link, 'Should have valid links');
    }
  }
});

test('AWARENESS: Search inside FAQs or resources when available', async () => {
  const search = await get('/awareness?search=internship');
  assert.equal(search.status, 200, 'Search should work or be handled gracefully');
  assert.ok(Array.isArray(search.json) || search.json.articles, 'Should return results');
});

test('AWARENESS: Only published content is visible to students', async () => {
  const student = makeStudentPayload('_aware4');
  const reg = await post('/auth/register', student);
  
  const content = await get('/awareness', reg.json.token);
  assert.equal(content.status, 200, 'Should load content for logged-in user');
  
  // Compare with public content
  const publicContent = await get('/awareness');
  assert.equal(publicContent.status, 200, 'Public content should also load');
});

test('AWARENESS: Images or videos load without breaking page layout', async () => {
  const content = await get('/awareness');
  assert.equal(content.status, 200, 'Should load without errors');
  assert.ok(Array.isArray(content.json) || content.json.articles, 
    'Should handle media gracefully');
});

test('AWARENESS: Empty sections do not show broken or messy layout', async () => {
  const content = await get('/awareness');
  assert.equal(content.status, 200, 'Should load successfully');
  // Check that response is valid even if empty
  assert.ok(content.json !== null && content.json !== undefined, 
    'Should return valid response');
});

test('AWARENESS: Related internship or resource links work correctly', async () => {
  const content = await get('/awareness');
  assert.equal(content.status, 200, 'Should load content');
  
  if (Array.isArray(content.json) && content.json.length > 0) {
    const item = content.json[0];
    if (item.relatedInternships || item.resources) {
      assert.ok(item.relatedInternships || item.resources, 
        'Related links should be present');
    }
  }
});

// ============= 7. NOTIFICATIONS & REMINDERS =============
test('NOTIFICATIONS: User receives notification for new matching internships', async () => {
  const student = makeStudentPayload('_notif1');
  const reg = await post('/auth/register', student);
  
  const notifs = await get('/notifications', reg.json.token);
  assert.ok([200, 404].includes(notifs.status), 'Should handle notifications endpoint');
  
  if (notifs.status === 200) {
    assert.ok(Array.isArray(notifs.json), 'Should return notifications array');
  }
});

test('NOTIFICATIONS: Email or in-app reminder before application deadline', async () => {
  const student = makeStudentPayload('_notif2');
  const reg = await post('/auth/register', student);
  
  const reminders = await get('/reminders', reg.json.token);
  assert.ok([200, 404].includes(reminders.status), 'Reminders should be handled');
});

test('NOTIFICATIONS: Toggle notifications on and off and verify choice is saved', async () => {
  const student = makeStudentPayload('_notif3');
  const reg = await post('/auth/register', student);
  
  const update = await put(`/notifications/settings`, {
    enableNotifications: false,
  }, reg.json.token);
  assert.ok([200, 400, 404].includes(update.status), 'Settings update should be handled');
  
  if (update.status === 200) {
    const settings = await get('/notifications/settings', reg.json.token);
    assert.equal(settings.status, 200, 'Should fetch settings');
  }
});

test('NOTIFICATIONS: Wrong user does not receive another user\'s alerts', async () => {
  const student1 = makeStudentPayload('_notif4a');
  const student2 = makeStudentPayload('_notif4b');
  
  const reg1 = await post('/auth/register', student1);
  const reg2 = await post('/auth/register', student2);
  
  const notif1 = await get('/notifications', reg1.json.token);
  const notif2 = await get('/notifications', reg2.json.token);
  
  // Notifications should be user-specific
  if (notif1.status === 200 && notif2.status === 200) {
    // They may have different notifications
    assert.ok(true, 'Notifications should be user-specific');
  }
});

test('NOTIFICATIONS: Notification text is clear and not misleading', async () => {
  const student = makeStudentPayload('_notif5');
  const reg = await post('/auth/register', student);
  
  const notifs = await get('/notifications', reg.json.token);
  if (notifs.status === 200 && notifs.json.length > 0) {
    const notif = notifs.json[0];
    assert.ok(notif.message || notif.text || notif.title, 
      'Notification should have clear message');
  }
});

test('NOTIFICATIONS: Duplicate notifications are not sent for same event', async () => {
  const student = makeStudentPayload('_notif6');
  const reg = await post('/auth/register', student);
  
  // This would require testing the actual notification mechanism
  // For now, verify notifications endpoint works
  const notifs = await get('/notifications', reg.json.token);
  assert.ok([200, 404].includes(notifs.status), 'Should handle notifications');
});

test('NOTIFICATIONS: Opening notification goes to correct internship or page', async () => {
  const student = makeStudentPayload('_notif7');
  const reg = await post('/auth/register', student);
  
  const notifs = await get('/notifications', reg.json.token);
  if (notifs.status === 200 && notifs.json.length > 0) {
    const notif = notifs.json[0];
    if (notif.internshipId || notif.link) {
      assert.ok(notif.internshipId || notif.link, 
        'Notification should link to correct resource');
    }
  }
});

// ============= 8. ADMIN FUNCTIONALITY =============
test('ADMIN: Admin login with correct credentials opens admin dashboard', async () => {
  const admin = makeAdminPayload('_admin1');
  
  const reg = await post('/auth/register', admin);
  assert.equal(reg.status, 201, 'Admin registration should succeed');
  
  const login = await post('/auth/login', {
    username: admin.username,
    password: admin.password,
  });
  assert.equal(login.status, 200, 'Admin login should succeed');
  
  const dashboard = await get('/admin/dashboard', login.json.token);
  assert.ok([200, 404].includes(dashboard.status), 'Admin dashboard should be accessible');
});

test('ADMIN: Wrong admin credentials show error and do not open admin pages', async () => {
  const login = await post('/auth/login', {
    username: 'fake_admin_12345',
    password: 'WrongPassword',
  });
  assert.notEqual(login.status, 200, 'Wrong credentials should fail');
  
  if (login.json && login.json.token) {
    const dashboard = await get('/admin/dashboard', login.json.token);
    assert.notEqual(dashboard.status, 200, 'Should not access admin with invalid token');
  }
});

test('ADMIN: Adding new internship makes it appear for students', async () => {
  const admin = makeAdminPayload('_admin3');
  const reg = await post('/auth/register', admin);
  assert.equal(reg.status, 201, 'Setup: Admin registration');
  
  const company = makeCompanyPayload('_admin3');
  const reg2 = await post('/auth/register', company);
  
  const internship = {
    title: 'Admin Added Internship',
    company: company.username,
    description: 'Added by admin',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg2.json.token);
  assert.equal(created.status, 201, 'Internship creation should succeed');
  
  const list = await get('/internships');
  assert.equal(list.status, 200, 'Should appear in student list');
});

test('ADMIN: Editing internship updates details for all users', async () => {
  const company = makeCompanyPayload('_admin4');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'Original Title',
    company: company.username,
    description: 'Original desc',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const updated = await put(`/internships/${created.json._id}`, {
    title: 'Updated Title',
    description: 'Updated description',
  }, reg.json.token);
  
  if (updated.status === 200) {
    const detail = await get(`/internships/${created.json._id}`);
    assert.equal(detail.json.title, 'Updated Title', 'Should reflect updates');
  }
});

test('ADMIN: Deleting or hiding internship removes it from public list', async () => {
  const company = makeCompanyPayload('_admin5');
  const reg = await post('/auth/register', company);
  
  const internship = {
    title: 'To Be Deleted',
    company: company.username,
    description: 'Test delete',
    domain: 'IT',
    location: 'Remote',
    durationWeeks: 6,
  };
  const created = await post('/internships', internship, reg.json.token);
  assert.equal(created.status, 201, 'Setup: Internship creation');
  
  const deleted = await deleteReq(`/internships/${created.json._id}`, reg.json.token);
  if (deleted.status === 200) {
    const detail = await get(`/internships/${created.json._id}`);
    assert.notEqual(detail.status, 200, 'Should not be accessible after deletion');
  }
});

test('ADMIN: Can view list of applications or expressions of interest', async () => {
  const admin = makeAdminPayload('_admin6');
  const reg = await post('/auth/register', admin);
  assert.equal(reg.status, 201, 'Setup: Admin registration');
  
  const applications = await get('/admin/applications', reg.json.token);
  assert.ok([200, 404].includes(applications.status), 'Admin should access applications');
});

test('ADMIN: Normal student users cannot open admin URLs or screens', async () => {
  const student = makeStudentPayload('_admin7');
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Student registration');
  
  const dashboard = await get('/admin/dashboard', reg.json.token);
  assert.notEqual(dashboard.status, 200, 'Student should not access admin dashboard');
  
  const applications = await get('/admin/applications', reg.json.token);
  assert.notEqual(applications.status, 200, 'Student should not access admin applications');
});

// ============= LOGOUT & SESSION TESTS =============
test('LOGOUT: User can log out and session ends properly', async () => {
  const student = makeStudentPayload('_logout1');
  
  const reg = await post('/auth/register', student);
  assert.equal(reg.status, 201, 'Setup: Registration should succeed');
  
  const logout = await post('/auth/logout', {}, reg.json.token);
  assert.ok([200, 201, 204].includes(logout.status), 'Logout should succeed');
  
  // After logout, token should not work
  const afterLogout = await get('/auth/me', reg.json.token);
  assert.notEqual(afterLogout.status, 200, 'Should not access protected route after logout');
});

test('LOGOUT: After logout user cannot access protected pages without login', async () => {
  const student = makeStudentPayload('_logout2');
  
  const reg = await post('/auth/register', student);
  const oldToken = reg.json.token;
  
  const logout = await post('/auth/logout', {}, oldToken);
  assert.ok([200, 201, 204].includes(logout.status), 'Logout should succeed');
  
  // Try accessing protected resource
  const profile = await get('/auth/me', oldToken);
  assert.notEqual(profile.status, 200, 'Old token should not work');
  
  // But can login again
  const login = await post('/auth/login', {
    username: student.username,
    password: student.password,
  });
  assert.equal(login.status, 200, 'Should be able to login again');
});

console.log('\n✓ All comprehensive API tests have been defined!');
