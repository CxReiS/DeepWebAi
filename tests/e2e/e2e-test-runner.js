#!/usr/bin/env node
/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// Comprehensive E2E Test Runner for DeepWebAI
// This runner handles the complete test lifecycle

import { spawn, exec } from 'child_process';
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const print = {
  status: (msg) => console.log(`${colors.blue}[E2E]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  test: (msg) => console.log(`${colors.cyan}[TEST]${colors.reset} ${msg}`),
  workflow: (msg) => console.log(`${colors.magenta}[WORKFLOW]${colors.reset} ${msg}`)
};

// Test suites configuration
const testSuites = {
  auth: {
    name: 'Authentication Flow Tests',
    files: ['auth-complete-flow.spec.ts'],
    description: 'Registration, login, MFA, OAuth, password reset',
    timeout: 120000
  },
  features: {
    name: 'Feature Flag Tests',
    files: ['feature-flags.spec.ts'],
    description: 'Flag creation, targeting, real-time updates, analytics',
    timeout: 90000
  },
  files: {
    name: 'File Processing Tests',
    files: ['file-processing.spec.ts'],
    description: 'Upload, OCR, metadata extraction, storage',
    timeout: 180000
  },
  ai: {
    name: 'AI Gateway Tests',
    files: ['ai-gateway.spec.ts'],
    description: 'Provider routing, fallback, caching, streaming',
    timeout: 150000
  },
  realtime: {
    name: 'Real-time Features Tests',
    files: ['realtime-features.spec.ts'],
    description: 'WebSocket, chat, notifications, collaboration',
    timeout: 120000
  },
  workflow: {
    name: 'AI Workflow Tests',
    files: ['ai-workflow.spec.ts'],
    description: 'End-to-end AI processing workflows',
    timeout: 200000
  }
};

// Utility functions
const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    if (options.silent) {
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || 'Unknown error'}`));
      }
    });
    
    process.on('error', reject);
  });
};

const checkPlaywrightInstallation = async () => {
  try {
    await runCommand('npx', ['playwright', '--version'], { silent: true });
    return true;
  } catch {
    return false;
  }
};

const installPlaywright = async () => {
  print.status('Installing Playwright...');
  try {
    await runCommand('npx', ['playwright', 'install']);
    print.success('Playwright installed successfully');
    return true;
  } catch (error) {
    print.error(`Failed to install Playwright: ${error.message}`);
    return false;
  }
};

const setupEnvironment = async () => {
  print.status('Setting up E2E test environment...');
  
  try {
    // Check if .env.test exists
    if (!fs.existsSync('.env.test')) {
      print.warning('.env.test not found, creating from .env.example...');
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env.test');
        
        // Update for test environment
        let envContent = fs.readFileSync('.env.test', 'utf8');
        envContent = envContent.replace(/NODE_ENV=.*/g, 'NODE_ENV=test');
        envContent = envContent.replace(/DATABASE_URL=.*/g, 'DATABASE_URL=$TEST_DATABASE_URL');
        fs.writeFileSync('.env.test', envContent);
        
        print.success('.env.test created and configured');
      } else {
        print.error('.env.example not found. Please create .env.test manually.');
        return false;
      }
    }
    
    // Create auth directory
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Create test reports directory
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    print.success('Environment setup completed');
    return true;
    
  } catch (error) {
    print.error(`Environment setup failed: ${error.message}`);
    return false;
  }
};

const runTestSuite = async (suiteName, options = {}) => {
  const suite = testSuites[suiteName];
  if (!suite) {
    throw new Error(`Unknown test suite: ${suiteName}`);
  }
  
  print.workflow(`Running ${suite.name}...`);
  print.test(suite.description);
  
  const args = [
    'playwright',
    'test',
    ...suite.files.map(file => path.join('tests/e2e', file)),
    '--config=tests/e2e/playwright.config.ts'
  ];
  
  if (options.headed) args.push('--headed');
  if (options.debug) args.push('--debug');
  if (options.reporter) args.push(`--reporter=${options.reporter}`);
  if (options.project) args.push(`--project=${options.project}`);
  if (options.timeout) args.push(`--timeout=${options.timeout}`);
  
  try {
    const result = await runCommand('npx', args);
    print.success(`${suite.name} completed successfully`);
    return result;
  } catch (error) {
    print.error(`${suite.name} failed: ${error.message}`);
    throw error;
  }
};

const runAllTests = async (options = {}) => {
  print.workflow('Starting comprehensive E2E test run...');
  
  const results = {};
  const suiteNames = Object.keys(testSuites);
  
  for (const suiteName of suiteNames) {
    try {
      print.workflow(`\n${'='.repeat(60)}`);
      print.workflow(`RUNNING: ${testSuites[suiteName].name.toUpperCase()}`);
      print.workflow(`${'='.repeat(60)}`);
      
      const startTime = Date.now();
      await runTestSuite(suiteName, options);
      const duration = Date.now() - startTime;
      
      results[suiteName] = {
        status: 'passed',
        duration,
        suite: testSuites[suiteName]
      };
      
      print.success(`✅ ${testSuites[suiteName].name} - ${duration}ms`);
      
    } catch (error) {
      results[suiteName] = {
        status: 'failed',
        error: error.message,
        suite: testSuites[suiteName]
      };
      
      print.error(`❌ ${testSuites[suiteName].name} - FAILED`);
      
      if (!options.continueOnFailure) {
        print.error('Stopping test run due to failure');
        break;
      }
    }
  }
  
  // Print summary
  print.workflow(`\n${'='.repeat(60)}`);
  print.workflow('TEST SUMMARY');
  print.workflow(`${'='.repeat(60)}`);
  
  const passed = Object.values(results).filter(r => r.status === 'passed');
  const failed = Object.values(results).filter(r => r.status === 'failed');
  
  passed.forEach(result => {
    print.success(`✅ ${result.suite.name} (${result.duration}ms)`);
  });
  
  failed.forEach(result => {
    print.error(`❌ ${result.suite.name} - ${result.error}`);
  });
  
  print.workflow(`\nTotal: ${Object.keys(results).length} | Passed: ${passed.length} | Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    print.error(`${failed.length} test suite(s) failed`);
    process.exit(1);
  } else {
    print.success('All test suites passed! 🎉');
  }
  
  return results;
};

const generateTestReport = async () => {
  print.status('Generating comprehensive test report...');
  
  try {
    const args = [
      'playwright',
      'show-report',
      'tests/e2e/reports'
    ];
    
    await runCommand('npx', args);
    print.success('Test report opened in browser');
    
  } catch (error) {
    print.error(`Failed to generate report: ${error.message}`);
  }
};

const showMenu = () => {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 DEEPWEBAI E2E TEST RUNNER');
  console.log('='.repeat(60));
  console.log('\nSelect test suite to run:');
  console.log('1) Authentication Flow Tests');
  console.log('2) Feature Flag Tests');
  console.log('3) File Processing Tests');
  console.log('4) AI Gateway Tests');
  console.log('5) Real-time Features Tests');
  console.log('6) AI Workflow Tests');
  console.log('7) Run All Tests');
  console.log('8) Run All Tests (Continue on Failure)');
  console.log('9) Run with Browser UI (Headed Mode)');
  console.log('10) Debug Mode');
  console.log('11) Generate Test Report');
  console.log('12) Test Environment Setup');
  console.log('13) Exit');
  
  process.stdout.write('\nEnter your choice (1-13): ');
};

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'setup':
        await setupEnvironment();
        break;
      case 'auth':
        await runTestSuite('auth');
        break;
      case 'features':
        await runTestSuite('features');
        break;
      case 'files':
        await runTestSuite('files');
        break;
      case 'ai':
        await runTestSuite('ai');
        break;
      case 'realtime':
        await runTestSuite('realtime');
        break;
      case 'workflow':
        await runTestSuite('workflow');
        break;
      case 'all':
        await runAllTests();
        break;
      case 'all-continue':
        await runAllTests({ continueOnFailure: true });
        break;
      case 'headed':
        await runAllTests({ headed: true });
        break;
      case 'debug':
        await runAllTests({ debug: true });
        break;
      case 'report':
        await generateTestReport();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        console.log('Available commands: setup, auth, features, files, ai, realtime, workflow, all, all-continue, headed, debug, report');
        break;
    }
    return;
  }
  
  // Interactive mode
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Check prerequisites
  print.status('Checking prerequisites...');
  
  const hasPlaywright = await checkPlaywrightInstallation();
  if (!hasPlaywright) {
    const installed = await installPlaywright();
    if (!installed) {
      print.error('Failed to install Playwright. Please install manually.');
      process.exit(1);
    }
  }
  
  const envSetup = await setupEnvironment();
  if (!envSetup) {
    print.error('Environment setup failed. Please check configuration.');
    process.exit(1);
  }
  
  print.success('Prerequisites check completed');
  
  const handleChoice = async (choice) => {
    try {
      switch (choice) {
        case '1':
          await runTestSuite('auth');
          break;
        case '2':
          await runTestSuite('features');
          break;
        case '3':
          await runTestSuite('files');
          break;
        case '4':
          await runTestSuite('ai');
          break;
        case '5':
          await runTestSuite('realtime');
          break;
        case '6':
          await runTestSuite('workflow');
          break;
        case '7':
          await runAllTests();
          break;
        case '8':
          await runAllTests({ continueOnFailure: true });
          break;
        case '9':
          await runAllTests({ headed: true });
          break;
        case '10':
          await runAllTests({ debug: true });
          break;
        case '11':
          await generateTestReport();
          break;
        case '12':
          await setupEnvironment();
          break;
        case '13':
          print.status('Exiting...');
          rl.close();
          return;
        default:
          print.error('Invalid choice. Please try again.');
          break;
      }
    } catch (error) {
      print.error(`Test execution failed: ${error.message}`);
    }
    
    // Show menu again
    setTimeout(() => {
      showMenu();
      rl.once('line', handleChoice);
    }, 1000);
  };
  
  showMenu();
  rl.once('line', handleChoice);
}

// Handle process termination
process.on('SIGINT', () => {
  print.status('\nExiting E2E test runner...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  print.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    print.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTestSuite,
  runAllTests,
  setupEnvironment,
  generateTestReport
};
