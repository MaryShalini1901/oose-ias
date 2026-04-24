const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const RUN_ID = Date.now();

function makeStudentPayload() {
  return {
    fullName: 'Test Student',
    username: `stud_${RUN_ID}`,
    password: 'Stud1234',
    role: 'student',
    email: `stud_${RUN_ID}@mail.com`,
    phone: '9876543210',
  };
}

function makeCompanyPayload() {
  return {
    fullName: 'Test Company',
    username: `comp_${RUN_ID}`,
    password: 'Comp@1234',
    role: 'company',
    email: `comp_${RUN_ID}@mail.com`,
    phone: '9876543201',
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

test('Auth + internship flow works without Selenium', async () => {
  const student = makeStudentPayload();
  const company = makeCompanyPayload();

  const regStudent = await post('/auth/register', student);
  assert.equal(regStudent.status, 201, `student register failed: ${JSON.stringify(regStudent.json)}`);
  assert.ok(regStudent.json.token);

  const regCompany = await post('/auth/register', company);
  assert.equal(regCompany.status, 201, `company register failed: ${JSON.stringify(regCompany.json)}`);
  assert.ok(regCompany.json.token);

  const loginStudent = await post('/auth/login', {
    username: student.username,
    password: student.password,
  });
  assert.equal(loginStudent.status, 200, `student login failed: ${JSON.stringify(loginStudent.json)}`);
  const studentToken = loginStudent.json.token;
  assert.ok(studentToken);

  const loginCompany = await post('/auth/login', {
    username: company.username,
    password: company.password,
  });
  assert.equal(loginCompany.status, 200, `company login failed: ${JSON.stringify(loginCompany.json)}`);
  const companyToken = loginCompany.json.token;
  assert.ok(companyToken);

  const internshipTitle = `Internship ${RUN_ID}`;
  const created = await post(
    '/internships',
    {
      title: internshipTitle,
      company: company.username,
      description: 'Automation test internship',
      domain: 'Web',
      location: 'Remote',
      durationWeeks: 8,
    },
    companyToken
  );
  assert.equal(created.status, 201, `internship create failed: ${JSON.stringify(created.json)}`);
  assert.ok(created.json._id);

  const approve = await put(`/admin/internships/${created.json._id}/approve`, {}, companyToken);
  assert.notEqual(
    approve.status,
    200,
    'Company token should not approve internships; expected forbidden/admin-only behavior'
  );

  const approvedList = await get('/internships');
  assert.equal(approvedList.status, 200, `list internships failed: ${JSON.stringify(approvedList.json)}`);
  assert.ok(Array.isArray(approvedList.json));

  const mine = await get('/internships/mine', companyToken);
  assert.equal(mine.status, 200, `company mine list failed: ${JSON.stringify(mine.json)}`);
  assert.ok(Array.isArray(mine.json));
});
