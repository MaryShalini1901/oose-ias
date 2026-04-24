#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function runCommand(command, description) {
  return new Promise((resolve) => {
    log(colors.cyan, `\n► ${description}...`);
    const proc = exec(command, (error, stdout, stderr) => {
      if (error) {
        log(colors.red, `✗ Failed: ${description}`);
        console.error(stderr);
        resolve(false);
      } else {
        log(colors.green, `✓ Passed: ${description}`);
        resolve(true);
      }
    });
    
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
  });
}

async function runAllTests() {
  const startTime = Date.now();
  
  log(colors.bright + colors.blue, '\n╔════════════════════════════════════════════════════╗');
  log(colors.bright + colors.blue, '║         COMPREHENSIVE TEST SUITE RUNNER              ║');
  log(colors.bright + colors.blue, '╚════════════════════════════════════════════════════╝\n');
  
  const tests = [
    {
      name: 'API Tests',
      command: 'node --test testing/api/comprehensive-test-suite.cjs',
      description: 'Running comprehensive API test suite (65+ tests)',
    },
  ];
  
  // Add UI tests if enabled
  if (process.env.RUN_UI_TESTS !== 'false') {
    tests.push({
      name: 'UI Tests',
      command: 'node --test testing/ui/comprehensive-ui-flows.test.cjs',
      description: 'Running comprehensive UI test suite (40+ tests)',
    });
  }
  
  const results = [];
  
  for (const test of tests) {
    log(colors.bright + colors.blue, `\n[${test.name}]`);
    const result = await runCommand(test.command, test.description);
    results.push({ name: test.name, passed: result });
  }
  
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  
  // Summary
  log(colors.bright + colors.blue, '\n╔════════════════════════════════════════════════════╗');
  log(colors.bright + colors.blue, '║                    TEST SUMMARY                     ║');
  log(colors.bright + colors.blue, '╚════════════════════════════════════════════════════╝\n');
  
  for (const result of results) {
    const status = result.passed
      ? colors.green + '✓ PASSED'
      : colors.red + '✗ FAILED';
    log(colors.bright, `${status} ${colors.reset} - ${result.name}`);
  }
  
  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  log(colors.yellow, `\nTotal: ${totalPassed}/${totalTests} test suites passed`);
  log(colors.yellow, `Time: ${elapsed}s\n`);
  
  if (totalPassed === totalTests) {
    log(colors.bright + colors.green, '🎉 ALL TESTS PASSED! 🎉\n');
    process.exit(0);
  } else {
    log(colors.bright + colors.red, '❌ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

// Check if servers are running
async function checkServers() {
  const servers = [
    { url: 'http://localhost:5000', name: 'Backend API (port 5000)' },
    { url: 'http://localhost:5500', name: 'Frontend UI (port 5500)' },
  ];
  
  log(colors.yellow, '\n🔍 Checking required servers...\n');
  
  for (const server of servers) {
    try {
      const res = await fetch(server.url, { timeout: 2000 });
      log(colors.green, `✓ ${server.name} is running`);
    } catch {
      log(colors.yellow, `⚠ ${server.name} might not be running`);
      log(colors.yellow, `  Make sure to run: npm start (backend) and open frontend on port 5500`);
    }
  }
}

// Main execution
(async () => {
  try {
    // Show which tests will run
    const includeUI = process.env.RUN_UI_TESTS !== 'false';
    log(colors.bright + colors.yellow, '\n📋 Test Configuration:');
    log(colors.yellow, `   • API Tests: ENABLED (65+ tests)`);
    log(colors.yellow, `   • UI Tests: ${includeUI ? 'ENABLED' : 'DISABLED'} (40+ tests)`);
    log(colors.yellow, `   • Total: ${includeUI ? '105+' : '65+'} tests`);
    
    // Check servers
    if (process.env.SKIP_SERVER_CHECK !== 'true') {
      await checkServers();
    }
    
    // Run tests
    await runAllTests();
  } catch (error) {
    log(colors.red, `\n❌ Error: ${error.message}`);
    process.exit(1);
  }
})();
